function enterGame(){
    var enter = document.getElementById('enter').value
    if(enter.length === 0){ // 닉네임 입력안했을 때 경고창
        Swal.fire({
            title: "게임 알림",
            text: "닉네임을 입력해주세요",
            confirmButtonText: "네",
            confirmButtonColor: '#9c9f93'
        });
    }else if( enter.length < 2 || enter.length > 9 ){ // 글자 수 틀렸을 때 경고창
        Swal.fire({
            title: "게임 알림",
            text: "닉네임은 최소 2자에서 최대 8자 입니다.",
            confirmButtonText: "네",
            confirmButtonColor: '#9c9f93'
        });
    }else{ // 제대로 입력했을 때
        localStorage.setItem("nickName", enter);//닉네임은 브라우저의 LocalStorage에 저장
        location.href= "/game" //게임화면으로 이동
    }


}