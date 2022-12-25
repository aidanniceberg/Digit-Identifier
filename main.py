from flask import Flask, render_template, request
from sklearn import datasets, svm
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import MinMaxScaler
import numpy as np
import json

app = Flask(__name__)


# creates the model that predicts an image based
# on it's pixel values
# also facilitates new predictions
class DigitModel:
    def __init__(self):
        self.model = self.create_model()

    # perform all necessary data preparation steps
    # in this case, it is only standardizing the data
    def clean(self, data):
        data = self.standardize(data)
        return data

    # scale all data to values between 0 and 1
    def standardize(self, data):
        return  MinMaxScaler().fit_transform(data)

    def create_model(self):
        # load data from sklearn built in digit dataset
        digits = datasets.load_digits()
        data = self.clean(digits.data)
        targets = digits.target

        # split data into train/test
        X_train, X_test, y_train, y_test = train_test_split(data, targets, shuffle=True)

        # fit SVC model to the training data
        curr_model = svm.SVC()
        curr_model.fit(X_train, y_train)

        # generate predictions and display classification report
        predictions = curr_model.predict(X_test)
        print(classification_report(predictions, y_test))

        return curr_model

    # take an input and predict a digit
    def predict(self, pixels):
        pixels = self.clean(pixels.reshape(64, 1)).reshape(1, 64)
        return self.model.predict(pixels)


model = DigitModel()


# render index.html to the main page
@app.route('/')
def home():
    return render_template('index.html')


# processes post request made from client side
# generates and returns a prediction
@app.route('/predict', methods=['POST'])
def predict():
    arr = np.array(json.loads(request.data))
    prediction = model.predict(np.array([arr])).tolist()[0]
    response = {'prediction': prediction}
    return json.dumps(response)


if __name__ == '__main__':
    app.run()
