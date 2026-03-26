# 황금거위 데이터 요청 및 대시보드 설계 초안

## 1. 목적

본 문서는 황금거위 앱의 광고 수익화 구조, 유저 트래픽, 퍼널 전환, 리워드 정책, 광고 기술 세팅을 한 번에 점검하기 위한 데이터 요청서 겸 대시보드 설계 초안입니다.

실무에서는 아래 3가지를 동시에 맞춰야 합니다.

1. 어떤 지표를 볼 것인지
2. 각 지표를 어떤 기준으로 계산할 것인지
3. 현재 보유 데이터로 가능한지, 추가 수집이 필요한지

## 2. 현재 보유 데이터 기준

현재 워크스페이스의 [golden_goose_cleaned.csv](/Users/dongwon.lee/Documents/모두의충전%20데이터분석/golden_goose_cleaned.csv) 기준으로 확인된 컬럼은 아래와 같습니다.

- 날짜
- Ecpm
- 한화
- 요청수
- 일치율
- DAU
- 신규가입
- 누적 가입자수
- Ads 집행비용

즉, 현재는 `일자 단위의 총합 수준` 데이터는 일부 확보되어 있으나, 아래 세부 분해 데이터는 없습니다.

- 광고 네트워크별 분해
- 광고 타입별 분해
- OS별 분해
- 국가별 분해
- Impression 실제값
- 회원/광고 이벤트 로그 기반 퍼널
- 리텐션 산출용 코호트 데이터
- 광고 시청 유저 수 및 유저별 시청 횟수
- 리워드 정책/출금 정책 문서
- 광고 SDK/미디에이션 구조 문서

## 3. 우선 결론

현재 데이터만으로 바로 가능한 항목:

- 일/주/월 광고 매출 총합
- 요청수
- Fill Rate(= 현재 컬럼 `일치율`로 해석 가능)
- eCPM
- DAU
- 신규 유저 수
- 일부 파생지표
  - ARPDAU = 일매출 / DAU
  - CAC 유사 참고치 = Ads 집행비용 / 신규가입
  - 광고비 대비 매출 = 매출 / Ads 집행비용

현재 데이터만으로는 불가능하거나 부정확한 항목:

- 광고 네트워크별 성과
- 광고 유형별 성과
- OS / 국가별 성과
- ARPU 정식 산출
- MAU
- 유입 채널별 비중
- D1 / D7 / D30 리텐션
- 재방문 유저 비율
- 전 퍼널 단계 전환율
- 광고 시청 유저 비율
- 유저당 평균 광고 시청 수
- 일일 제한 대비 평균 시청 수
- 리워드 정책 및 광고 세팅 구조 전반

## 4. 데이터 요청 항목 정의

아래 표는 요청 항목, 정의, 산식, 현재 상태, 필요 데이터 소스를 정리한 기준안입니다.

| 구분 | 항목 | 정의 | 권장 산식 | 현재 상태 | 필요 소스 |
|---|---|---|---|---|---|
| 광고 매출 | 일 광고 매출 | 일자별 총 광고 매출 | `sum(revenue)` | 가능 | 현재 CSV |
| 광고 매출 | 주 광고 매출 | 주차별 총 광고 매출 | `sum(revenue)` | 가능 | 현재 CSV |
| 광고 매출 | 월 광고 매출 | 월별 총 광고 매출 | `sum(revenue)` | 가능 | 현재 CSV |
| 광고 매출 | 광고 네트워크별 성과 | AdMob, UnityAds 등 네트워크별 성과 | network 기준 집계 | 불가 | 광고 플랫폼 raw export |
| 광고 매출 | Impression | 실제 노출 수 | `sum(impressions)` | 불가 | 광고 대시보드 export |
| 광고 매출 | Request | 광고 요청 수 | `sum(requests)` | 가능 | 현재 CSV |
| 광고 매출 | Fill Rate | 요청 대비 매칭 또는 노출 비율 | `impressions / requests` 또는 현재 정의 확인 필요 | 부분 가능 | 현재 CSV + 정의 확인 |
| 광고 매출 | eCPM | 천 회 노출당 매출 | `revenue / impressions * 1000` | 부분 가능 | 현재 CSV + impressions |
| 광고 매출 | Revenue | 광고 매출 | `sum(revenue)` | 가능 | 현재 CSV |
| 광고 매출 | 광고 유형별 성과 | Rewarded / Interstitial / Banner 성과 | ad_type 기준 집계 | 불가 | 광고 로그 또는 광고 export |
| 광고 매출 | OS별 성과 | Android / iOS 성과 | OS 기준 집계 | 불가 | 앱 로그 + 광고 로그 |
| 광고 매출 | 국가별 성과 | 국가별 광고 성과 | country 기준 집계 | 불가 | 광고 로그 + geo 정보 |
| 광고 매출 | ARPDAU | 활성 유저 1인당 일매출 | `daily_revenue / dau` | 가능 | 현재 CSV |
| 광고 매출 | ARPU | 전체 유저 또는 유료/활성 기준 1인당 매출 | 기준 정의 필요 | 불가 | 사용자 모수 정의 필요 |
| 트래픽 | DAU | 일 활성 유저 수 | distinct active users | 가능 | 현재 CSV |
| 트래픽 | MAU | 월 활성 유저 수 | distinct monthly active users | 불가 | 유저 레벨 로그 |
| 트래픽 | 신규 유저 수(일/주) | 신규 유입/가입 유저 수 | signup date 기준 집계 | 일 가능 / 주 가능 | 현재 CSV |
| 트래픽 | 유입 채널 비중 | Organic / Paid 등 채널별 유입 구성 | channel 기준 비중 | 불가 | MMP 또는 어트리뷰션 데이터 |
| 트래픽 | 리텐션 D1/D7/D30 | 설치 후 재방문 유지율 | cohort retention | 불가 | 유저 이벤트 로그 |
| 트래픽 | 재방문 유저 비율 | 당일 방문자 중 기존 유저 비중 | returning users / dau | 불가 | 유저 레벨 방문 로그 |
| 퍼널 | 설치 → 실행 | 앱 설치 후 첫 실행 전환 | first_open / install | 불가 | MMP + 앱 이벤트 |
| 퍼널 | 실행 → 회원가입 | 앱 실행 후 회원가입 전환 | signup / app_open | 불가 | 앱 이벤트 |
| 퍼널 | 회원가입 → 메인 진입 | 가입 후 메인 도달 전환 | main_enter / signup | 불가 | 앱 이벤트 |
| 퍼널 | 메인 진입 → 황금알 클릭 | 메인 진입 후 핵심 CTA 클릭 | egg_click / main_enter | 불가 | 앱 이벤트 |
| 퍼널 | 황금알 클릭 → 광고 시작 | 광고 진입 전환 | ad_start / egg_click | 불가 | 앱 이벤트 + 광고 콜백 |
| 퍼널 | 광고 시작 → 광고 완료 | 광고 완료율 | ad_complete / ad_start | 불가 | 광고 SDK 이벤트 |
| 퍼널 | 광고 완료 → 포인트 지급 | 리워드 지급 성공률 | reward_grant / ad_complete | 불가 | 서버/앱 리워드 로그 |
| 퍼널 | 포인트 지급 → 재방문 | 보상 후 재방문율 | revisit / reward_grant | 불가 | 유저 코호트 로그 |
| 퍼널 보조 | DAU 대비 광고 시청 유저 비율 | 광고 1회 이상 본 유저 비율 | `ad_view_users / dau` | 불가 | 유저별 광고 시청 로그 |
| 퍼널 보조 | 유저 1인당 평균 광고 시청 수 | 광고 시청 유저 또는 DAU 기준 평균 | `ad_views / users` | 불가 | 광고 시청 이벤트 |
| 퍼널 보조 | 1일 제한 대비 평균 시청 수 | 캡 대비 사용량 | `avg_views_per_user / daily_cap` | 불가 | 광고 시청 로그 + 정책 문서 |
| 정책 | 광고 1회 시청당 지급 포인트 | 광고 1건 보상 단가 | 정책값 | 문서 필요 | 운영 정책 문서 |
| 정책 | 포인트 환산 가치 | 현금/상품 기준 전환 가치 | 환산표 기준 | 문서 필요 | 보상 정책 |
| 정책 | 일일 보상 제한 정책 | 1일 최대 시청/보상 한도 | 정책값 | 문서 필요 | 운영 정책 |
| 정책 | 미션/보상 구조 | 랜덤/고정/시간제한 여부 | 정책 기술 | 문서 필요 | 기획서 |
| 정책 | 보상 지급 방식 | 즉시/지연/실패 재지급 | 정책 기술 | 문서 필요 | 서버/기획 문서 |
| 정책 | 포인트 출금 조건 | 최소 금액, 검수, 제한 | 정책 기술 | 문서 필요 | 운영 정책 |
| 광고 기술 | 사용 광고 네트워크 | 현재 붙어 있는 네트워크 목록 | 리스트업 | 문서 필요 | SDK/콘솔 설정 |
| 광고 기술 | Mediation 사용 여부 | 미디에이션 여부 | yes/no | 문서 필요 | 광고 설정 문서 |
| 광고 기술 | Waterfall / Bidding 구조 | 운영 구조 | 구조 기술 | 문서 필요 | 광고 설정 문서 |
| 광고 기술 | 광고 호출 위치 및 타이밍 | 앱 내 어떤 화면에서 어떤 조건으로 호출되는지 | 플로우 기술 | 문서 필요 | 앱 기획/개발 문서 |
| 광고 기술 | SDK 및 연동 방식 | 클라이언트/서버 연동 구조 | 구조 기술 | 문서 필요 | 개발 문서 |
| 참고 | 경쟁 앱 리스트 | 비교 대상 앱 목록 | 리스트업 | 문서 필요 | 사업/운영 자료 |
| 참고 | 내부 벤치마크 기준 | 판단 기준값 | KPI 기준표 | 문서 필요 | 내부 운영 자료 |
| 참고 | 광고 운영 정책/가이드 | 현재 실행 중 정책 | 문서 기술 | 문서 필요 | 사내 문서 |
| 참고 | 향후 계획/고민 사항 | 실험/개선 아이템 | 이슈 리스트 | 문서 필요 | 팀 인터뷰 |

## 5. 대시보드 탭 권장 구조

보고용 문서는 아래 6개 탭 또는 섹션 구조로 만들면 깔끔합니다.

### A. Executive Summary

- 기간별 총 광고 매출
- DAU / 신규가입 추이
- ARPDAU 추이
- 핵심 이슈 3개
- 이번 달 개선 포인트

### B. 광고 수익화 성과

- 일/주/월 매출 추이
- 요청수 / Impression / Fill Rate / eCPM
- 네트워크별 성과
- 광고 타입별 성과
- 국가 / OS별 성과

### C. 유저 트래픽

- DAU / MAU
- 신규 유저
- 채널별 유입 비중
- 리텐션 D1 / D7 / D30
- 재방문 유저 비율

### D. 유저 퍼널

- 설치 → 실행
- 실행 → 회원가입
- 회원가입 → 메인 진입
- 메인 진입 → 황금알 클릭
- 황금알 클릭 → 광고 시작
- 광고 시작 → 광고 완료
- 광고 완료 → 포인트 지급
- 포인트 지급 → 재방문

### E. 리워드 정책 / UX

- 광고 1회 보상 포인트
- 보상 가치
- 일일 제한 정책
- 미션 구조
- 지급 시점
- 출금 조건

### F. 광고 운영 구조

- 광고 네트워크 구성
- Mediation 여부
- Waterfall / Bidding 구조
- 광고 위치 및 호출 타이밍
- SDK 연동 방식

## 6. 이벤트 로그 설계 권장안

퍼널과 광고 효율을 보려면 최소 아래 이벤트가 필요합니다.

| 이벤트명 | 설명 | 필수 속성 |
|---|---|---|
| `app_install` | 설치 | `user_id`, `install_time`, `channel`, `campaign`, `os`, `country` |
| `app_open` | 앱 실행 | `user_id`, `event_time`, `session_id` |
| `sign_up_complete` | 회원가입 완료 | `user_id`, `event_time`, `signup_method` |
| `main_enter` | 메인 화면 진입 | `user_id`, `event_time` |
| `golden_egg_click` | 황금알 클릭 | `user_id`, `event_time`, `screen_name` |
| `ad_request` | 광고 요청 | `user_id`, `event_time`, `ad_type`, `placement`, `network_candidate` |
| `ad_impression` | 광고 노출 | `user_id`, `event_time`, `ad_type`, `placement`, `network`, `revenue`, `ecpm`, `country`, `os` |
| `ad_start` | 광고 시작 | `user_id`, `event_time`, `ad_type`, `placement`, `network` |
| `ad_complete` | 광고 완료 | `user_id`, `event_time`, `ad_type`, `placement`, `network` |
| `reward_grant` | 포인트 지급 완료 | `user_id`, `event_time`, `reward_points`, `reward_status` |
| `withdraw_request` | 출금 요청 | `user_id`, `event_time`, `point_amount`, `cash_value` |
| `app_revisit` | 재방문 판정용 실행 | `user_id`, `event_time`, `days_since_install` |

## 7. 계산식 기준안

지표 정의 혼선을 줄이기 위해 아래 기준으로 통일하는 것을 권장합니다.

- Fill Rate: `impressions / requests`
- eCPM: `revenue / impressions * 1000`
- ARPDAU: `daily_revenue / dau`
- ARPU: `period_revenue / unique_users_in_period`
- D1 Retention: `install_day+1 재방문 유저 / install_day 설치 유저`
- 광고 완료율: `ad_complete / ad_start`
- 리워드 지급 성공률: `reward_grant / ad_complete`
- 광고 시청 유저 비율: `1회 이상 ad_complete 유저 / dau`
- 유저당 평균 광고 시청 수: `ad_complete 수 / ad_complete 유저 수`
- 일일 캡 소진율: `avg_daily_views_per_user / daily_view_cap`

## 8. 지금 바로 만들 수 있는 1차 버전

현재 보유 데이터만으로 우선 제작 가능한 1차 버전은 아래입니다.

### 포함 가능

- 일/주/월 광고 매출
- 요청수
- Fill Rate(현재 `일치율` 사용, 단 정의 재확인 필요)
- eCPM
- DAU
- 신규 유저 수
- ARPDAU
- 광고비 대비 매출

### 제외 또는 보류

- Impression
- 네트워크/광고유형/OS/국가별 분해
- MAU
- 리텐션
- 전체 퍼널
- 광고 시청 유저 비율
- 유저당 평균 광고 시청 수
- 정책/기술 구조 문서화

## 9. 추가 요청해야 할 원천 데이터

우선순위 기준으로 요청하면 아래 순서가 가장 효율적입니다.

### 1순위

- 광고 플랫폼 일자별 raw export
  - date
  - network
  - ad_type
  - os
  - country
  - requests
  - impressions
  - revenue
  - ecpm

- 앱 이벤트 로그
  - user_id
  - event_name
  - event_time
  - os
  - country
  - channel

### 2순위

- 리워드 정책 문서
- 출금 정책 문서
- 광고 운영 구조 문서
- 광고 placement 정의서

### 3순위

- 경쟁 앱 리스트
- 내부 KPI 벤치마크
- 향후 수익화 개선 계획

## 10. 실무용 요청 문안 예시

아래 문안을 그대로 붙여서 데이터 요청용으로 사용할 수 있습니다.

> 황금거위 앱의 광고 수익화 및 퍼널 분석을 위해 아래 데이터가 필요합니다.
> 1) 일자 기준 광고 성과 raw 데이터: date, network, ad_type, os, country, requests, impressions, revenue, ecpm
> 2) 유저 이벤트 로그: user_id, event_name, event_time, os, country, acquisition_channel
> 3) 리워드/출금 정책 문서
> 4) 광고 네트워크 및 미디에이션 설정 문서
> 분석 목적은 광고 매출, 유저 트래픽, 퍼널 전환율, 보상 정책, 광고 운영 구조를 통합 점검하는 것입니다.

## 11. 다음 액션 권장안

1. 현재 CSV로 1차 대시보드 작성
2. 광고 raw export 추가 요청
3. 앱 이벤트 로그 추가 요청
4. 정책/기술 문서 수집
5. 최종 통합 리포트로 확장
