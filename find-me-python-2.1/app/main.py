from fastapi import FastAPI, File, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .cv_parser import parse_cv_pdf
from .models import ParseCVResponse, ParseData

app = FastAPI(title="Find-Me CV Parser", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/recommendations/{user_id}")
def recommendations_stub(
    user_id: int,
    user_role: str = Query(default="CANDIDAT"),
    top_n: int = Query(default=4),
):
    """Stub : le front appelle cette route ; recommandations ML = hors scope parseur CV."""
    return []


@app.post("/parse-cv/", response_model=ParseCVResponse)
async def parse_cv(file: UploadFile = File(...)):
    content = await file.read()
    if not content:
        return ParseCVResponse(
            data=ParseData(),
            metadata={
                "extraction_method": "rule_based_grounded",
                "ocr_quality_score": 0.0,
                "ocr_acceptable": False,
                "overall_confidence": 0.0,
                "warnings": ["Fichier vide."],
                "grounded_fields_removed": 0,
            },
            validation={
                "is_valid": False,
                "can_save": False,
                "issues": [
                    {
                        "field": "file",
                        "message": "Fichier PDF vide.",
                        "severity": "error",
                    }
                ],
            },
        )
    return parse_cv_pdf(content, filename=file.filename or "")
