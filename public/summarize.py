# This script will be used to handle the summarization task.

# It will accept input from node.js, process it with the BART model 
# (https://huggingface.co/facebook/bart-large-cnn)
# (https://huggingface.co/docs/transformers/en/model_doc/bart)
# and output the result back to node.js.

from transformers import BartTokenizer, BartForConditionalGeneration # type: ignore
import sys
import json

# import the model and tokenizer once at the start
model = BartForConditionalGeneration.from_pretrained('facebook/bart-large-cnn')
tokenizer = BartTokenizer.from_pretrained('facebook/bart-large-cnn')


# function to perform summarization
def summarize(text):
    # tokenize the input text
    # max_length: maximum length of the input text
    # return_tensors: return the tensors in PyTorch format
    # truncation: truncate the input text if it exceeds the maximum length
    inputs = tokenizer([text], max_length=2048, return_tensors='pt', truncation=True)

    # generate the summary 
    # max_length: maximum length of the output text
    # min_length: minimum length of the output text
    # length_penalty: how much model favors shorter vs longer outputs
    # num_beams: helps model explore more potential outputs
    # early_stopping: true, if need concise summary, false otherwise
    # !! current values are pretty optimal, not much noticed when increasing.
    summary_ids = model.generate(inputs['input_ids'], max_length=500, min_length=100, length_penalty=1.5, num_beams=4)
    
    # decode the summary
    # skip_special_tokens: whether to skip the special tokens (tokens added to  input text by tokenizer)
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    
    # return the summary
    return summary


if __name__ == "__main__":
    # read the input from node.js
    input_data = json.loads(sys.stdin.read())
    text = input_data["text"]
    
    # perform summarization
    result = {"summary": summarize(text)}
    
    # output the result as JSON
    print(json.dumps(result))
