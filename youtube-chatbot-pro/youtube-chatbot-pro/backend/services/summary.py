"""Summary generator — structured video summary."""
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .rag import retrieve_context
from .llm_provider import get_llm


def generate_summary(
    llm_provider: str,
    llm_model: str = None,
    llm_api_key: str = None,
) -> str:
    context = retrieve_context("summary overview main points", k=12)

    prompt = PromptTemplate(
        template="""
You are an expert content summarizer. Create a structured summary of this YouTube video.

Use this EXACT format:

## One-Line Summary
(One sentence capturing the video's core message)

## Key Takeaways
- (5-7 bullet points, each one a complete idea)

## Main Topics Covered
- (List the major topics/themes)

## Important Insights
- (2-3 deeper insights or "aha" moments)

## Actionable Advice
- (If applicable, practical tips the viewer can apply)

Transcript context:
{context}
""",
        input_variables=["context"],
    )

    llm = get_llm(
        provider=llm_provider,
        model=llm_model,
        api_key=llm_api_key,
        temperature=0.4,
    )
    chain = prompt | llm | StrOutputParser()
    return chain.invoke({"context": context})
