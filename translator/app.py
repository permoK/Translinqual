from flask import Flask, request, jsonify
from selenium import webdriver
from selenium.webdriver.common.by import By
import time

app = Flask(__name__)

def translate_to_dholuo(text):
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')

    driver = webdriver.Chrome(options=options)

    try:
        driver.get("https://translate.google.com/?sl=en&tl=luo")
        time.sleep(2)

        input_box = driver.find_element(By.XPATH, "//textarea[@aria-label='Source text']")
        input_box.clear()
        input_box.send_keys(text)
        time.sleep(3)

        translated = driver.find_element(By.XPATH, "//span[@jsname='W297wb']").text
        return translated if translated else "Translation not found."
    except Exception as e:
        return f"Error: {e}"
    finally:
        driver.quit()

@app.route('/translate', methods=['POST'])
def translate():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'Missing "text" field'}), 400

    text = data['text']
    translated_text = translate_to_dholuo(text)
    return jsonify({'translated': translated_text})

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)

