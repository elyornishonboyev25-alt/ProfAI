"""Extract production-ready SAT question assets from a College Board paper PDF.

Usage:
  python scripts/extract_sat_practice_test.py \
    --test "path/to/sat-practice-test-4-digital.pdf" \
    --answers "path/to/sat-practice-test-4-answers-digital.pdf" \
    --output public/sat/practice-test-4

The source PDF uses a stable gray question-header bar. We use that vector
geometry instead of OCR, which keeps graphs, tables, and mathematical notation
pixel-perfect while producing one responsive WebP asset per question.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

import pdfplumber
from PIL import Image
from pypdf import PdfReader


MODULE_PAGES = {
    "rw1": range(4, 18),
    "rw2": range(18, 31),
    "math1": range(34, 40),
    "math2": range(42, 49),
}

EXPLANATION_PAGES = {
    "rw1": range(2, 18),
    "rw2": range(18, 34),
    "math1": range(34, 44),
    "math2": range(44, 54),
}

EXPECTED_COUNTS = {"rw1": 33, "rw2": 33, "math1": 27, "math2": 27}


def is_question_bar(obj: dict[str, Any]) -> bool:
    color = obj.get("non_stroking_color")
    is_gray = isinstance(color, tuple) and len(color) >= 4 and abs(float(color[-1]) - 0.2) < 0.01
    return (
        is_gray
        and 220 <= float(obj.get("width", 0)) <= 330
        and 10 <= float(obj.get("height", 0)) <= 14
        and 100 <= float(obj.get("top", 0)) <= 735
    )


def question_number(page: Any, bar: dict[str, Any]) -> int:
    header = page.crop(
        (
            float(bar["x0"]),
            float(bar["top"]),
            min(float(bar["x0"]) + 28, float(page.width)),
            float(bar["bottom"]) + 2,
        )
    ).extract_text() or ""
    match = re.search(r"\d+", header)
    if not match:
        raise ValueError(f"Could not read question number from header: {header!r}")
    return int(match.group())


def extract_question_images(
    test_pdf: Path,
    output_dir: Path,
    force_module: str | None = None,
    force_pages: list[int] | None = None,
) -> list[dict[str, Any]]:
    question_dir = output_dir / "questions"
    question_dir.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, Any]] = []

    with pdfplumber.open(test_pdf) as pdf:
        for module_id, page_numbers in MODULE_PAGES.items():
            module_questions: list[int] = []

            for page_number in page_numbers:
                page = pdf.pages[page_number - 1]
                stop_tops = [
                    float(word["top"])
                    for word in page.extract_words()
                    if word["text"].strip().upper() == "STOP"
                ]
                page_content_limit = min(stop_tops) - 8 if stop_tops else 730
                objects = [*page.rects, *page.curves]
                bars = sorted(
                    (obj for obj in objects if is_question_bar(obj)),
                    key=lambda item: (float(item["top"]), float(item["x0"])),
                )

                numbered_bars = [(question_number(page, bar), bar) for bar in bars]
                for number, bar in numbered_bars:
                    column = "left" if float(bar["x0"]) < 300 else "right"
                    next_headers = [
                        next_bar
                        for _, next_bar in numbered_bars
                        if ("left" if float(next_bar["x0"]) < 300 else "right") == column
                        and float(next_bar["top"]) > float(bar["top"])
                    ]
                    crop_bottom = (
                        min(float(item["top"]) for item in next_headers) - 4
                        if next_headers
                        else page_content_limit
                    )
                    crop_bottom = min(crop_bottom, page_content_limit)
                    crop_left = max(0, float(bar["x0"]) - 2)
                    crop_right = min(float(page.width), float(bar["x1"]) + 2)
                    content_objects = [
                        *page.chars,
                        *page.lines,
                        *page.rects,
                        *page.curves,
                        *page.images,
                    ]
                    content_bottoms = [
                        float(item["bottom"])
                        for item in content_objects
                        if float(item.get("bottom", 0)) >= float(bar["bottom"])
                        and float(item.get("top", 0)) < crop_bottom
                        and float(item.get("x1", 0)) >= crop_left
                        and float(item.get("x0", page.width)) <= crop_right
                    ]
                    if content_bottoms:
                        crop_bottom = min(crop_bottom, max(content_bottoms) + 12)
                    crop = page.crop(
                        (
                            crop_left,
                            max(0, float(bar["top"]) - 1),
                            crop_right,
                            min(float(page.height), crop_bottom),
                        )
                    )

                    filename = f"{module_id}-{number:02d}.webp"
                    destination = question_dir / filename
                    should_force = force_module == module_id or page_number in (force_pages or [])
                    if destination.exists() and not should_force:
                        with Image.open(destination) as existing:
                            image_width, image_height = existing.size
                    else:
                        image = crop.to_image(resolution=180, antialias=True).original
                        image.save(destination, "WEBP", quality=84, method=4)
                        image_width, image_height = image.size

                    module_questions.append(number)
                    manifest.append(
                        {
                            "moduleId": module_id,
                            "number": number,
                            "page": page_number,
                            "asset": f"/sat/practice-test-4/questions/{filename}",
                            "width": image_width,
                            "height": image_height,
                        }
                    )

            expected = list(range(1, EXPECTED_COUNTS[module_id] + 1))
            if sorted(module_questions) != expected:
                raise ValueError(
                    f"{module_id}: expected questions {expected}, found {sorted(module_questions)}"
                )

    return sorted(
        manifest,
        key=lambda item: (
            list(MODULE_PAGES).index(item["moduleId"]),
            item["number"],
        ),
    )


def clean_explanation_page(text: str) -> str:
    text = re.sub(r"SAT ANSWER EXPLANATIONS\s+n\s+[^\n]+", " ", text)
    text = re.sub(r"\d+\s+SAT PRACTICE TEST #4 ANSWER EXPLANATIONS", " ", text)
    text = re.sub(r"SAT PRACTICE TEST #4 ANSWER EXPLANATIONS", " ", text)
    return re.sub(r"[ \t]+", " ", text)


def extract_explanations(answers_pdf: Path) -> dict[str, dict[str, str]]:
    reader = PdfReader(answers_pdf)
    result: dict[str, dict[str, str]] = {}

    for module_id, pages in EXPLANATION_PAGES.items():
        combined = "\n".join(
            clean_explanation_page(reader.pages[page_number - 1].extract_text() or "")
            for page_number in pages
        )
        matches = list(re.finditer(r"\bQUESTION\s+(\d+)\b", combined))
        module_explanations: dict[str, str] = {}

        for index, match in enumerate(matches):
            number = int(match.group(1))
            if number < 1 or number > EXPECTED_COUNTS[module_id]:
                continue
            end = matches[index + 1].start() if index + 1 < len(matches) else len(combined)
            explanation = combined[match.end() : end]
            explanation = re.sub(r"\s+", " ", explanation).strip()
            explanation = re.sub(r"\bT (?=[a-z])", "T", explanation)
            explanation = re.sub(r"\s+n{1,2}\s*$", "", explanation).strip()
            module_explanations[str(number)] = explanation

        expected = {str(number) for number in range(1, EXPECTED_COUNTS[module_id] + 1)}
        missing = sorted(expected - set(module_explanations), key=int)
        if missing:
            raise ValueError(f"{module_id}: missing explanations for {missing}")
        result[module_id] = module_explanations

    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", required=True, type=Path)
    parser.add_argument("--answers", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--force-module",
        choices=list(MODULE_PAGES),
        help="Regenerate one module while reusing the other module assets.",
    )
    parser.add_argument(
        "--force-page",
        type=int,
        action="append",
        help="Regenerate questions found on one source PDF page.",
    )
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    manifest = extract_question_images(
        args.test,
        args.output,
        args.force_module,
        args.force_page,
    )
    explanations = extract_explanations(args.answers)

    (args.output / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (args.output / "explanations.json").write_text(
        json.dumps(explanations, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(
        f"Extracted {len(manifest)} question assets and "
        f"{sum(len(items) for items in explanations.values())} explanations."
    )


if __name__ == "__main__":
    main()
