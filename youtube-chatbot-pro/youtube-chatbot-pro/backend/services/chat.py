"""Chat service — RAG-based Q&A."""
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .rag import retrieve_context
from .llm_provider import get_llm


def chat_with_video(
    question: str,
    llm_provider: str,
    llm_model: str = None,
    llm_api_key: str = None,
) -> str:
    context = retrieve_context(question, k=5)

    prompt = PromptTemplate(
        template="""
You are an expert AI tutor analyzing a YouTube video transcript.

INSTRUCTIONS:
- Answer ONLY using the context below.
- Use clean Markdown: bullet points (- ), bold (**text**), and short headings (##).
- Add relevant emojis to make it engaging.
- If the answer is NOT in the context, reply exactly: "I don't know based on the video."
- Keep answers concise but complete (3-8 bullet points).

CONTEXT FROM VIDEO:
{context}

USER QUESTION:
{question}

YOUR ANSWER:
""",
        input_variables=["context", "question"],
    )

    llm = get_llm(
        provider=llm_provider,
        model=llm_model,
        api_key=llm_api_key,
        temperature=0.3,
    )
    chain = prompt | llm | StrOutputParser()
    return chain.invoke({"context": context, "question": question})
