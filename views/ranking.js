var rank_script = document.getElementById("ranking__list");

window.addEventListener('load', function(){
    var url = 'http://localhost:8000';
    var socket = io.connect(url);
    var list_3 = [];

    socket.on('rank_r',function(data){
        for (var i = 0 ; i<data.name.length; i++){
            list_3.push([data.name[i],data.stage[i],data.time[i]]);
        }
        // 넘겨받은 배열들을 2차원 배열로 저장

        list_3.sort((a, b) => {
            if (a[1] === b[1]) {
                return b[2] - a[2]
            } else {
                return b[1] - a[1]
            }
        });
        // 스테이지를 내림차순으로 정렬 (스테이지가 높을 수록 높은 순위)
        // 스테이지가 같을 때 버틴 시간을 내림차순으로 정리 (같은 스테이지인 경우 버틴 시간이 긴 경우 높은 순위)

        function ranking(){
            var str = `<tr><td>순위</td><td>닉네임</td>`+`<td>스테이지</td>`+`<td>버틴 시간</td></tr>`;
            var x =``;
            for (var i = 0; i<list_3.length; i++){
                x += `<tr><td>`+(i+1)+`위</td><td>`+list_3[i][0]+`</td>`+`<td>`+list_3[i][1]+` Stage</td>`+`<td>`+list_3[i][2]+`초</td></tr>`;
            }
            // 순위 정렬이 끝난 배열을 랭킹창에 작성

            str+=x
            return str;
        }
        // 반복문을 통해 html 파일에 들어갈 내용 작성

        rank_script.innerHTML=`
        <table>`
        + ranking()
        +`</table>` ;  
    });

});
