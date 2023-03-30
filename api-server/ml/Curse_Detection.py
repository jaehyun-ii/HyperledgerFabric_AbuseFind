
import pandas as pd
from soynlp.normalizer import *
from konlpy.tag import Komoran
import tensorflow as tf
import numpy as np
import pickle
import sys
import os
import subprocess
from keras.models import load_model

komoran = Komoran()
tokenizer = tf.keras.preprocessing.text.Tokenizer()
stop_words = []
score = 0
edited_lines = []
# 불용어 리스트 만들기
def make_stop_words():
    ft = open('/root/go/src/fabric-ml/server/ml/stopword.txt', 'r')
    lines = ft.readlines()
    for i in lines:
        i = i.rstrip()
        i=i.split(",")
        for j in i:
            stop_words.append(j)
    ft.close()

# 욕설 감지
def sentiment_predict(sentence):

    # 한글,숫자를 제외한 외국어,특수문자 제거 && 의미없는 반복문자 제거
    sentence = only_hangle_number(sentence)
    sentence = emoticon_normalize(sentence)

    # 형태소 분리/ 불용어 제거
    word_tokens = komoran.morphs(sentence)
    word_tokens = [word for word in word_tokens if not word in stop_words]

    # 인코딩/ 패딩
    with open("/root/go/src/fabric-ml/server/ml/tokenizer.pickle", 'rb') as handle:
        tokenizer = pickle.load(handle)
        sentence = tokenizer.texts_to_sequences(sentence)
        sentence = tf.keras.preprocessing.sequence.pad_sequences(sentence, padding='post', maxlen=100)
        sentence = np.array(sentence)
    #모델 로드, 욕설감지
    if sentence!="":
        loaded_model = load_model("/root/go/src/fabric-ml/server/ml/best_model.h5")
        score = loaded_model.predict(sentence) # 예측
        return np.max(score)
    return 0

# 카카오톡 내보내기 txt 파일에서 욕설이 들어간 문장 제거
make_stop_words()
ft = open(sys.argv[1], 'r')
lines = ft.readlines()
for i in lines:
    if i[0]=='[':
        sentence=i.split(" ")
        curse=sentence[3:]
        curse = " ".join(curse)
        score = sentiment_predict(curse)
        if score<0.3:
            sentence = " ".join(sentence[:3])
            sentence = sentence + " " + curse
            edited_lines.append(sentence)
        else:
            sentence = " ".join(sentence[:3])
            sentence = sentence + " 욕설이 포함된 문장입니다.\n" 
            edited_lines.append(sentence)
    else:
        edited_lines.append(i)
ft.close()

with open(sys.argv[1], 'w') as ft:
    ft.writelines(edited_lines)
