from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("./doctor_response_model", use_fast=False, legacy=False, local_files_only=True)
print(tokenizer("hello world"))
