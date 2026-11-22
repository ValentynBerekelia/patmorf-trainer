# -*- coding: utf-8 -*-
"""
Витягання бази препаратів із «Патоморфологія препарати.pdf».

Генерує:
  src/data/preparations.json   — структуровані дані
  public/preparations/*.jpeg   — зображення, витягнуті з PDF без перестискання

Запуск:
    pip install pymupdf
    python tools/extract_from_pdf.py "C:/шлях/до/Патоморфологія препарати.pdf"

Як влаштований PDF (перевірено на всіх 41 сторінці):
  * стор. 1 — алгоритм опису, препаратів немає;
  * на кожній наступній сторінці 1–3 препарати;
  * ЛІВА колонка (x < 212) — заголовок «№ 182 – Шлунок» / «Без номера - Яєчник»
    (може переноситись на другий рядок) і під ним фото;
  * ПРАВА колонка (x >= 212) — опис за пунктами 1–6, де п.6 поділено на А/Б/В.

Зіставлення фото з описом — за вертикальними смугами: фото належить тому
заголовку, чия смуга [y_заголовка; y_наступного_заголовка) містить центр фото.
Описи ріжуться окремо — по рядках, що починаються з «1.», бо перший рядок опису
інколи стоїть трохи вище за свій заголовок.
"""
from __future__ import annotations

import json
import os
import re
import sys
from collections import Counter

import fitz  # pymupdf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_IMG = os.path.join(ROOT, 'public', 'preparations')
OUT_DATA = os.path.join(ROOT, 'src', 'data')

COLUMN_SPLIT_X = 212
HDR = re.compile(r'^\s*(№\s*\S|Без\s+ном|Без\s+назв)')
DESC_START = re.compile(r'^\s*1\s*\.')

CATEGORIES = {
    'tumors': 'Пухлини',
    'inflammation': 'Запалення',
    'circulation': 'Розлади кровообігу',
    'dystrophy': 'Дистрофії та порушення обміну',
    'necrosis': 'Некроз',
    'adaptation': 'Адаптація, склероз, гіпертрофія',
    'other': 'Інші загальнопатологічні процеси',
}

# Короткі назви діагнозів — виписані з п.6.А кожного препарату (нічого не вигадано).
# Ключ — порядковий номер препарату в PDF.
sys.path.insert(0, HERE)
from diagnoses_map import DIAGNOSES, REVIEW_NOTES  # noqa: E402  (локальний модуль поруч)


def category_of(section_a: str) -> str:
    t = section_a.lower()

    def has(*keys: str) -> bool:
        return any(k in t for k in keys)

    if has('процес гіпертрофії', 'несправжньої гіпертрофії', 'несправжня гіпертрофія',
           'спотвореної регенерації', 'вікарна гіпертрофія', 'гідроцефалія',
           'концентрична гіпертрофія'):
        return 'adaptation'
    if has('пухлинне новоутворення', 'метастаз', 'рак ', 'раку', 'канцероматоз', 'пухлинні'):
        return 'tumors'
    if has('запалення', 'абсцес', 'цистит', 'менінгіт', 'плеврит', 'перитоніт', 'перикардит',
           'гастрит', 'ендокардит', 'туберкульоз', 'сифіл', 'трихінельоз', 'пієлонефрит',
           'гранульом', 'гепатит', 'емпієма'):
        return 'inflammation'
    if has('тромб', 'кровообігу', 'кроовобігу', 'крововилив', 'інфаркт', 'емболія',
           'повнокрів', 'застій', 'шок', 'індурац', 'гематом', 'гемотампонад'):
        return 'circulation'
    if has('дистрофія', 'дистрофії', 'амілоїдоз', 'гіаліноз', 'пігмент', 'гемомеланоз',
           'антракоз', 'мінерального обміну', 'холестерин', 'мускатна'):
        return 'dystrophy'
    if has('некроз', 'гангрена', 'нома'):
        return 'necrosis'
    if has('гіпертрофія', 'гіперплазія', 'регенерац', 'цироз', 'склероз', 'емфізема',
           'гідронефроз', 'карніфікація', 'атрофія'):
        return 'adaptation'
    return 'other'


def parse_title(title: str):
    """«№ 76/33 – Гомілкова кістка» -> ('76/33', 'Гомілкова кістка')."""
    t = re.sub(r'\s+', ' ', title).strip()
    m = re.match(r'^№\s*([0-9/]+)\s*[-\u2013\u2014]\s*(.+)$', t)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    m = re.match(r'^Без\s+(?:номера|назви)\s*[-\u2013\u2014]\s*(.+)$', t)
    if m:
        return None, m.group(1).strip()
    return None, t


def split_sections(text: str) -> dict[int, str]:
    """Ріже опис на пункти 1–6, приймаючи лише строго зростаючу послідовність."""
    marks = [(int(m.group(1)), m.start(), m.end())
             for m in re.finditer(r'^\s*([1-6])\s*\.', text, re.M)]
    keep, want = [], 1
    for num, start, end in marks:
        if num == want:
            keep.append((num, start, end))
            want += 1
    out: dict[int, str] = {}
    for i, (num, _, end) in enumerate(keep):
        stop = keep[i + 1][1] if i + 1 < len(keep) else len(text)
        out[num] = re.sub(r'\s+', ' ', text[end:stop]).strip()
    return out


def split_abc(section6: str) -> tuple[str, str, str]:
    def grab(letter: str, nxt: str) -> str:
        m = re.search(rf'(?:^|\s){letter}\s*[\.\)]\s*(.*?)(?=(?:\s(?:{nxt})\s*[\.\)]\s)|$)',
                      section6, re.S)
        return re.sub(r'\s+', ' ', m.group(1)).strip() if m else ''

    return grab('А', 'Б'), grab('Б', 'В'), grab('В', 'ZZZ')


def extract(pdf_path: str) -> list[dict]:
    doc = fitz.open(pdf_path)
    os.makedirs(OUT_IMG, exist_ok=True)
    os.makedirs(OUT_DATA, exist_ok=True)

    items: list[dict] = []
    index = 0

    for page_no in range(1, doc.page_count):  # стор. 1 — алгоритм, не препарат
        page = doc[page_no]
        left, right = [], []
        for block in page.get_text('dict')['blocks']:
            if block['type'] != 0:
                continue
            for line in block['lines']:
                txt = ''.join(span['text'] for span in line['spans']).strip()
                if not txt:
                    continue
                x0, y0, y1 = line['bbox'][0], line['bbox'][1], line['bbox'][3]
                # x у ключі сортування обов'язковий: рядки на одній висоті
                # мають читатися зліва направо, а не за алфавітом.
                (left if x0 < COLUMN_SPLIT_X else right).append((y0, y1, x0, txt))
        left.sort()
        right.sort()

        # заголовки (з можливим переносом на другий рядок)
        heads = []
        for i, (y0, y1, _x, txt) in enumerate(left):
            if not HDR.match(txt):
                continue
            title, j, cursor = txt, i + 1, y1
            while j < len(left) and not HDR.match(left[j][3]) and left[j][0] - cursor < 12:
                title += ' ' + left[j][3]
                cursor = left[j][1]
                j += 1
            heads.append({'y': y0, 'title': re.sub(r'\s+', ' ', title).strip()})

        # описи: нова порція починається з рядка «1.»
        chunks: list[list[str]] = []
        for _y0, _y1, _x0, txt in right:
            if DESC_START.match(txt) or not chunks:
                chunks.append([])
            chunks[-1].append(txt)

        if len(chunks) != len(heads):
            raise SystemExit(
                f'Сторінка {page_no + 1}: {len(heads)} заголовків, але {len(chunks)} описів. '
                'Структура PDF відрізняється від очікуваної.')

        bounds = [h['y'] for h in heads] + [10 ** 6]
        images = sorted(page.get_image_info(xrefs=True),
                        key=lambda inf: (inf['bbox'][1] + inf['bbox'][3]) / 2)

        for k, head in enumerate(heads):
            index += 1
            lo = bounds[k] - 25 if k == 0 else bounds[k]
            hi = bounds[k + 1]
            mine = [inf for inf in images if lo <= (inf['bbox'][1] + inf['bbox'][3]) / 2 < hi]

            seen, xrefs = set(), []
            for inf in mine:  # одне й те саме фото інколи вставлене двічі
                if inf['xref'] in seen:
                    continue
                seen.add(inf['xref'])
                xrefs.append(inf['xref'])

            files = []
            for n, xref in enumerate(xrefs):
                data = doc.extract_image(xref)
                suffix = '' if len(xrefs) == 1 else f'-{n + 1}'
                name = f'prep-{index:03d}{suffix}.{data["ext"]}'
                with open(os.path.join(OUT_IMG, name), 'wb') as fh:
                    fh.write(data['image'])
                files.append({'src': f'preparations/{name}',
                              'width': data['width'], 'height': data['height']})

            secs = split_sections('\n'.join(chunks[k]))
            dx_a, dx_b, dx_c = split_abc(secs.get(6, ''))
            number, organ = parse_title(head['title'])

            items.append({
                'id': f'p{index:03d}',
                'index': index,
                'number': number,
                'organ': organ,
                'diagnosis': DIAGNOSES[index],
                'category': category_of(dx_a),
                'pdfPage': page_no + 1,
                'images': files,
                'description': {
                    'organ': secs.get(1, ''),
                    'localization': secs.get(2, ''),
                    'shape': secs.get(3, ''),
                    'size': secs.get(4, ''),
                    'structure': secs.get(5, ''),
                },
                'dx': {'main': dx_a, 'visible': dx_b, 'probable': dx_c},
                'needsReview': REVIEW_NOTES.get(index),
            })

    return items


def main() -> None:
    pdf_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.expanduser('~'), 'Desktop', 'Патоморфологія препарати.pdf')
    if not os.path.exists(pdf_path):
        raise SystemExit(f'Не знайдено PDF: {pdf_path}')

    items = extract(pdf_path)
    payload = {
        'source': os.path.basename(pdf_path),
        'generatedFrom': 'PDF, 41 сторінка, макроскопічні препарати (Підсумковий модуль №1)',
        'categories': CATEGORIES,
        'preparations': items,
    }
    with open(os.path.join(OUT_DATA, 'preparations.json'), 'w', encoding='utf-8') as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=1)

    print(f'Препаратів: {len(items)}')
    print(f'Зображень:  {sum(len(i["images"]) for i in items)}')
    print('Категорії: ', dict(Counter(CATEGORIES[i['category']] for i in items)))
    print('З номером: ', sum(1 for i in items if i['number']))


if __name__ == '__main__':
    main()
