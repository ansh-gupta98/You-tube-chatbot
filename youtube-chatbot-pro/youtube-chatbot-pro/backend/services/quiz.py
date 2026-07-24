"""Quiz generator — creates MCQ questions from the video."""
import json
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .rag import retrieve_context
from .llm_provider import get_llm


DIFFICULTY_GUIDE = {
    "Easy": "Basic recall and definitions. Straightforward questions.",
    "Medium": "Understanding and application. Slightly tricky options.",
    "Hard": "Deep analysis, edge cases, and multi-step reasoning.",
}


def generate_quiz(
    num_questions: int,
    difficulty: str,
    llm_provider: str,
    llm_model: str = None,
    llm_api_key: str = None,
) -> list[dict]:
    context = retrieve_context(f"quiz questions {difficulty}", k=12)
    guide = DIFFICULTY_GUIDE.get(difficulty, DIFFICULTY_GUIDE["Medium"])

    prompt = PromptTemplate(
        template="""
You are an exam creator for college students. Generate {n} multiple-choice questions
based ONLY on the video transcript below.

Difficulty: {difficulty}
Guidance: {guide}

Return STRICT JSON with this structure (no markdown, no extra text):
[
  {{
    "question": "The question text?",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct_index": 0,
    "explanation": "Why the correct answer is right, in 1-2 sentences."
  }}
]

Rules:
- "correct_index" is 0-based (0=A, 1=B, 2=C, 3=D).
- All 4 options must be plausible.
- Questions must be answerable from the transcript.

Transcript:
{context}
""",
        input_variables=["n", "difficulty", "guide", "context"],
    )

    llm = get_llm(
        provider=llm_provider,
        model=llm_model,
        api_key=llm_api_key,
        temperature=0.5,
    )
    chain = prompt | llm | StrOutputParser()
    raw = chain.invoke({
        "n": num_questions,
        "difficulty": difficulty,
        "guide": guide,
        "context": context,
    })

    # Robust JSON parsing
    try:
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        quiz = json.loads(raw)
        if isinstance(quiz, list) and len(quiz) > 0:
            return quiz[:num_questions]
    except Exception:
        pass
    return []
