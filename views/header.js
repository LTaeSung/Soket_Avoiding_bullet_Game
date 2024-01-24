const header = document.getElementById('nav_bar')
//index.html에 연결

// 상단 바 설정
header.innerHTML = `
        <div class="navbar__name">
            <a href="/game">총알 피하기</a>
        </div>

        <ul class="navbar__menu">
            <li><a href="#" id="modal_btn">게임 방법</a></li>
            
            
            <li><a href="/rank">랭킹</a></li>
            <li><a href="/guest">방명록</a></li>
        </ul>

        <ul class="navbar__icons">
            <i class="fas fa-share-alt-square"></i>
        </ul>`
    ;

//<a href> 태그는 명시된 주소로 페이지를 옯길 수 있다