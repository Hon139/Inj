import requests

url = "http://localhost:3000/quizzes"
file_path = "cohere/lesson.pdf"
user_id = 1

files = {'file': open(file_path, 'rb')}
data = {'userID': user_id}

response = requests.post(url, files=files, data=data)

if response.status_code == 200:
    print("Quizzes generated successfully")
    print(response.json())
else:
    print("Failed to generate quizzes")
    print(response.json())