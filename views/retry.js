const btnRetry = document.getElementById('retry')

// 리트라이 버튼 누르면 http://localhost:8000/game로 이동
btnRetry.addEventListener('click', () => {
    location.href= "/game"
})