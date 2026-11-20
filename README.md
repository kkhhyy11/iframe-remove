# Iframe Preview Tools

현재 탭에서 iframe 주소와 HTTPS 상태를 확인하는 Chrome 확장 프로그램입니다. [Ignore X-Frame headers 원본](https://github.com/guilryder/chrome-extensions/tree/main/xframe_ignore)과 별개로 설치합니다.

## 설치

1. Chrome 145 이상에서 `chrome://extensions`를 엽니다.
2. **개발자 모드**를 켜고 **압축해제된 확장 프로그램을 로드합니다**를 누릅니다.
3. `manifest.json`이 들어 있는 이 폴더를 선택합니다.
4. 새 버전만 테스트할 때는 `chrome://extensions`에서 기존 **Ignore X-Frame headers**를 잠시 끕니다. 두 확장이 켜져 있으면 기존 헤더 규칙도 함께 적용됩니다.

## 사용

1. iframe을 띄우는 부모 페이지를 HTTPS로 열고 확장 아이콘을 누릅니다. 부모 페이지의 주소와 탐지 가능한 iframe 주소를 확인할 수 있습니다.
2. 개발용 iframe의 HTTPS 주소를 선택하거나 입력합니다. `X-Frame-Options` 호환성 확인이 필요하면 **현재 탭에 적용**을 누르고 표시되는 사이트 권한을 허용합니다.
3. **iframe 새로고침**을 누르거나 페이지에서 iframe을 다시 엽니다. 새로고침 버튼은 부모 페이지에 직접 들어 있는 iframe 중 입력한 주소와 출처가 같은 항목을 다시 불러옵니다. 새로고침 버튼에 잡히지 않는 동적 iframe이나 리디렉션은 페이지에서 다시 열어 확인합니다.
4. **해제**를 누르면 이후 요청에 대한 규칙이 해제됩니다. 탭 또는 Chrome을 닫아도 규칙이 끝납니다. 허용한 사이트 권한은 Chrome의 확장 프로그램 세부정보에서 관리할 수 있습니다.

현재 탭의 부모 호스트에서 지정한 HTTPS 출처로 나가는 iframe 문서 요청에 `X-Frame-Options` 규칙이 적용됩니다. CSP는 보존됩니다. 대상 서버가 `frame-ancestors`를 사용한다면, 해당 서버의 CSP에서 허용할 부모 페이지의 HTTPS 출처를 지정해야 합니다.
