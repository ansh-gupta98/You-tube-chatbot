"""Topic extractor — pulls key topics from the video."""
import json
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .rag import retrieve_context
from .llm_provider import get_llm


def extract_topics(
    llm_provider: str,
    llm_model: str = None,
    llm_api_key: str = None,
) -> list[str]:
    context = retrieve_context("main topics themes keywords", k=10)

    prompt = PromptTemplate(
        template="""
From the video transcript below, extract 8-12 key topics as short keyword phrases.
Return ONLY a JSON array of strings. No markdown, no explanation.

Example output:
["machine learning", "neural networks", "backpropagation", "training data"]

Transcript:
{context}
""",
        input_variables=["context"],
    )

    llm = get_llm(
        provider=llm_provider,
        model=llm_model,
        api_key=llm_api_key,
        temperature=0.2,
    )
    chain = prompt | llm | StrOutputParser()
    raw = chain.invoke({"context": context})

    try:
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        topics = json.loads(raw)
        if isinstance(topics, list):
            return [str(t) for t in topics][:12]
    except Exception:
        pass
    return []
