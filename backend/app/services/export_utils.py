import csv
import io
from typing import Iterable

from fastapi.responses import StreamingResponse

try:
    from openpyxl import Workbook
except ImportError:  # pragma: no cover
    Workbook = None


def build_export_response(
    headers: list[str],
    rows: Iterable[list],
    filename: str,
    fmt: str = "csv",
) -> StreamingResponse:
    fmt = fmt.lower()
    if fmt not in {"csv", "xlsx"}:
        fmt = "csv"

    if fmt == "csv":
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(headers)
        for row in rows:
            writer.writerow(row)
        content = buffer.getvalue().encode("utf-8-sig")
        media_type = "text/csv"
        ext = "csv"
    else:
        if Workbook is None:
            raise RuntimeError("Excel export requires openpyxl")
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = "Report"
        sheet.append(headers)
        for row in rows:
            sheet.append(list(row))
        buffer = io.BytesIO()
        workbook.save(buffer)
        content = buffer.getvalue()
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ext = "xlsx"

    return StreamingResponse(
        io.BytesIO(content),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}.{ext}"'},
    )
