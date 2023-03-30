# HyperledgerFabric_AbuseFind
## 현재 작성중인 문서입니다. 
API / 블록체인 네트워크/ 체인코드 테스트 완료.
프론트엔드(리엑트) 작성중
## 문제 인식
### 이루다와 같은 채팅AI 서비스의 문제점 
1. 사용자의 채팅 데이터를 무단으로 수집해서 사용
2. 욕설, 혐오표현을 필터 없이 학습해 사용자에게 사용
### 빅데이터의 문제점
1. 데이터의 양질화X, 신뢰성X
2. 빅데이터를 구축하기 힘듬
## 동작
### 1.카카오톡 내보내기로 생성된 텍스트 파일을 업로드 -> 그대로 업로드 함으로써 사용자 편의성 확보가능
### 2.자연어 처리 정확도 80%의 딥러닝 모델을 통해 혐오표현, 욕설을 처리 >> 혐오표현,욕설이 포함된 문장은 블라인드 처리가 된다.
-> 혐오표현, 욕설을 포함된 문장이 블라인드 처리 되었기 때문에 문제점 1을 해결함

### 3.IPFS에 수정된 텍스트 파일을 업로드 하고 URI를 받아와 ERC-721 을 사용해 채팅 데이터를 NFT화

### 4.등록된 NFT는 자동으로 Admin에게 넘어가고 , 채팅 데이터의 용량에 일정 비율을 곱한 erc-20토큰이 지갑에 적용된다.
-> 채팅 데이터를 제공하는 주체에게 토큰을 지급함으로써 데이터 사용에 대한 허가를 얻음

### 5.기업들은 시장에 올라온 실제 사람들의 채팅데이터를 구매할 수 있으며, 마켓에 올라온 데이터를 정당한 대가를 지불하고 구함으로써 손쉽게 빅데이터를 구축할 수 있음.
-> 실제 사람들의 채팅데이터이고, 블록체인 특성상 레저의 채팅 데이터를 임의로 수정할 수 없으므로 데이터의 신뢰성이 높아짐, 데이터의 양질화
## Benefit
데이터는 개별적으로 지닌 가치가 크다고 보기 힘들며, 빅데이터가 만들어졌을때 가격이 크게 상승함
서비스제공자는 판매자들이 판매하는 개별적 데이터와 기업이 구매하는 빅데이터의 가치 차이를 통해 수익을 실현할 수 있을것임

## 개선사항
딥러닝모델의 경우 학습할 당시 개인정보와 관련된 학습데이터를 구하기가 힘들어 개인정보를 제외한 욕설 , 혐오포현만 학습시켰기 때문에 기존 빅데이터의 문제점인 무분별한 개인정보를 수집한다는 점을 해결하지 못했다.
개인정보 학습데이터를 구할 수 있다면? > 기존 딥러닝 모델을 재학습 시켜 개인정보 또한 블라인드 처리가 가능할 수 있을것임
