        var canvas = document.getElementById("myCanvas");
        var ctx = canvas.getContext("2d");

        var balls  = [];
        var ballMap = {};
        var myId;
        var rightPressed = false;
        var leftPressed = false;
        var upPressed = false;
        var downPressed = false;
        // 처음 입장 시 키보드는 눌리지 않은 상태

        const nickName = localStorage.getItem("nickName")


//--------------------------------------------------------------------------------------------------------------------------------------------

//--------------------------------------------------------------------------------------------------------------------------------------------

        document.addEventListener("keydown", keyDownHandler,false);
        // 키보드가 눌리면 keyHandler.js에 있는 keyDownHandler 함수 실행
        
        document.addEventListener("keyup", keyUpHandler,false);
        // 키보드를 떼면 keyUpHandler 함수 실행
        // 방향키 눌렀다 뗐다 하면 rightPressed, leftPressed... 값 변화

//--------------------------------------------------------------------------------------------------------------------------------------------


//--------------------------------------------------------------------------------------------------------------------------------------------

        function joinUser(id,color,x,y){
            let ball = new PlayerBall(id,color,x,y);
            ball.setColor(color);
            ball.setX(x);
            ball.setY(y);

            balls.push(ball);
            ballMap[id] = ball;
            
            return ball;
        }
        // 접속해 있던 플레이어, 지금 접속한 플레이어의 정보를 받아와 공 설정
//--------------------------------------------------------------------------------------------------------------------------------------------

//--------------------------------------------------------------------------------------------------------------------------------------------
        function leaveUser(id){
            for(var i = 0 ; i < balls.length; i++){
                if(balls[i].getId() == id){
                    balls.splice(i,1);
                    break;
                }
            }
            delete ballMap[id];
        }
        // 접속이 차단되어 게임에 참가하지 못한 플레이어, 게임을 끈 유저 socket.id를 받아와서
        // 배열에서 찾고 삭제

//--------------------------------------------------------------------------------------------------------------------------------------------

//--------------------------------------------------------------------------------------------------------------------------------------------
        function updateState(id,x,y){
            let ball = ballMap[id];
            if(!ball){
                return;
            }
            ball.setX(x);
            ball.setY(y);
        }
        //  나를 제외한 다른 사람의 좌표를 받아와서, 화면에 공을 세팅

//---------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------------
        function sendData() {
            let curPlayer = ballMap[myId];
            let data = {};
            data = {
                id: curPlayer.getId(),
                x: curPlayer.getX(),
                y: curPlayer.getY(),
            };
            if(data){
                socket.emit("send_location", data);
            }
        }
        // 내 아이디, 위치를 보냄

//---------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------------
        function collisionDetection(){
            let ball = ballMap[myId]
            for(var i = 0; i < enemys.length ; i++){
                if(  Math.sqrt((ball.getX() - enemys[i].getX())**2 + (ball.getY() - enemys[i].getY())**2) <= enemys[i].getRadius() + ball.getRadius()){
                    ball.setState(0);
                    socket.emit('collision_detect', {id : ball.getId()});
                    break;
                }
            }
            for(var i = 0; i < straightEnemys.length ; i++){
                if(  Math.sqrt((ball.getX() - straightEnemys[i].getX())**2 + (ball.getY() - straightEnemys[i].getY())**2) <= straightEnemys[i].getRadius() + ball.getRadius()){
                    ball.setState(0);
                    socket.emit('collision_detect', {id : ball.getId()});
                    break;
                }
            }
        }
        // 총알과의 충돌 판정 (각 반지름의 합 <= 거리 인 경우 충돌)
        // 충돌 시 공의 상태를 죽은 상태로 변경, 충돌한 공의 id를 담아 전송
        
        function acquireDetection(){
            let ball = ballMap[myId]
            for(var i = 0; i < items.length ; i++){
                if( ball.getState() != 0 && Math.sqrt((ball.getX() - items[i].getX())**2 + (ball.getY() - items[i].getY())**2) <= ball.getRadius() + items[i].getRadius()){
                    socket.emit('item_detect', {name : items[i].getName()});
                    items.splice(i,1);
                    break;
                }
            }
        }
        // 아이템과의 충돌
        // 충돌시 아이템을 없애고, 먹은 아이템의 정보를 보내줌

//---------------------------------------------------------------------------------------------------------------------------------------------


        var socket = io();


        socket.on('user_id', function(data){
            myId = data;
        });
        // 본인의 소켓 아이디를 받아와 저장

        socket.on('join_user', function(data){
            joinUser(data.id, data.color, data.x, data.y);
            
        })
        //플레이어들의 아이디, 색, 좌표들을 받아옴 > joinUser 함수 실행


        socket.on('leave_user', function(data){
            leaveUser(data);
        })
        //접속이 차단되어 게임에 참가하지 못한 플레이어, 게임을 끈 유저 socket.id를 받아오기 > leaveUser 함수 실행

        socket.on('update_state', function(data){
            updateState(data.id, data.x, data.y);
        })
        ////  나를 제외한 다른 사람의 좌표를 받아오기 > updateState 함수 실행

        socket.on('collision_update', function(data){
            for( var i = 0 ; i < balls.length; i++){
                if(balls[i].getId() == data.id){
                    balls[i].setState(0);
                    break;
                }
            }
        })
        // 충돌한 사람의 아이디를 받아와 죽은 상태로 변경
        
        var enemys = [];
        var straightEnemys = [];
        var items = [];



//---------------------------------------------------------------------------------------------------------------------------------------------

        
        socket.on('force_disconnect', function(data){
            Swal.fire({
                title: "게임 알림",
                backdrop:"#eee",
                text: "현재 게임 중입니다.\n나중에 접속 해 주세요.",
                confirmButtonText: "네",
                confirmButtonColor: '#9c9f93'
            }).then((result)=> {
                window.open('about:blank', '_self').close();
            })
        })
        // 7명 이상 접속해있거나, 게임 도중에 접속을 시작할 시 나오는 화면
        // 이렇게 수정하면 대화상자에서 확인버튼을 눌러야 about:blank로 이동되도록 수정

//---------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------------
        
        socket.on('enemy_generator', function(data){
            if(stop_bulletsEffect == false){
                let enemy = new EnemyBall(data.startingX, data.startingY, data.destinationX, data.destinationY, data.wall)
                enemys.push(enemy);                
            }

        })
        socket.on('straight_enemy_generator', function(data){
            console.log('hello');
            let straightEnemy = new straightEnemyBall(data.startingX, data.startingY, data.destinationX, data.destinationY, data.wall)
            straightEnemys.push(straightEnemy);
            console.log(straightEnemys);
        })
        socket.on('item_generator', function(data){
            let item = new itemBall(data.startingX, data.startingY, data.destinationX, data.destinationY, data.wall, data.name)
            items.push(item);
            console.log(items);
        })
        // 아이템 생성기에서 받은 정보들로 총알, 아이템을 생성 > 배열에 저장

//---------------------------------------------------------------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------------------------------------------------------------
        let delete_bulletsEffect = false;
        socket.on('delete_bullets_effect', function(data){
            delete_bulletsEffect = data.delete_bullets;
        })
        let stopTimer = 0;
        let stop_bulletsEffect = false;
        socket.on('stop_bullets_effect', function(data){
            stop_bulletsEffect = data.stop_bullets;
            stopTimer = timer;
        })
        // 총알 제거 먹으면 delete_bulletsEffect = true
        // 총알 정지 먹으면 stop_bulletsEffect = true, 먹은 시간 기록 (3초동안 적용)

//---------------------------------------------------------------------------------------------------------------------------------------------

let stage = 1; // 초기 설정 > 1스테이지

//---------------------------------------------------------------------------------------------------------------------------------------------

        socket.on('stage_number', function(data){
            stage = data.stage;
            timer = data.timer;
            console.log(stage)
        })
        // ?? stage_number를 보낸 곳이 없음

//---------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------------
var abc = 0;
    socket.on('game_over', function(data){
        if(abc==0){
            abc++;
            if (data.isFail){
                if(myId == balls[0].id){
                    var record_s = stage;
                    var record_t = (15-timer).toFixed(2);
                    Swal.fire({
                        title: "랭킹에 등록할 이름을 작성해주세요",
                        backdrop:"#eee",
                        width: 800,
                        input: 'text',
                        inputAttributes: {
                            autocapitalize: 'off'
                        },
                        confirmButtonText: "확인",
                        confirmButtonColor: '#9c9f93'
                    }).then((result)=>{
                        socket.emit('rank_s',{
                            name : result.value,
                            stage : record_s,
                            time : record_t
                        })
                        Swal.fire({
                            title : "랭킹 등록 완료",
                            backdrop:"#eee",
                            width: 800,
                            text: `이름 : ${result.value}, 스테이지 : ${record_s}, 시간 : ${record_t}`,
                            confirmButtonText: "확인",
                            confirmButtonColor: '#9c9f93'
                        }).then((result)=>{
                            stage=1;
                            location.href= "/bad";
                        })
                    })
                }
                else{
                    Swal.fire({
                        title: "게임 알림",
                        backdrop:"#eee",
                        width: 800,
                        text: "총알에 맞았습니다.",
                        confirmButtonText: "확인",
                        confirmButtonColor: '#9c9f93'
                    }).then((result)=> {
                        stage = 1;
                        location.href= "/bad";
                    })
                }
            }
        }
    })
        // 모든 플레이어가 죽으면 호스트에게 랭킹에 등록할 닉네임을 입력하는 대화상자 출력
        // 입력하면 닉네임, 죽을 당시 스테이지, 시간을 저장해서 server.js에 넘김 (맨 아래 쪽에 있음)
        // 모든 플레이어가 죽으면 대화상자 뜨고 확인 버튼 누르면 베드엔딩화면으로 넘어감

//---------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------------

        socket.on('game_win', function(data){
            if(myId != balls[0].id){
                Swal.fire({
                    title: "게임 알림",
                    backdrop:"#eee",
                    width: 800,
                    text: "모든 스테이지를 클리어하였습니다.",
                    confirmButtonText: "확인",
                    confirmButtonColor: '#9c9f93'
                }).then((result) => {
                    stage = 1;
                    location.href= "/good";
                })
            }else{
                var record_s = stage;
                var record_t = (15-timer).toFixed(2);
                Swal.fire({
                    title: "CLEAR\n랭킹에 등록할 이름을 작성해주세요",
                    backdrop:"#eee",
                    width: 800,
                    input: 'text',
                    inputAttributes: {
                        autocapitalize: 'off'
                    },
                    confirmButtonText: "확인",
                    confirmButtonColor: '#9c9f93'
                }).then((result)=>{
                    socket.emit('rank_s',{
                        name : result.value,
                        stage : record_s,
                        time : record_t
                    })
                    Swal.fire({
                        title : "랭킹 등록 완료",
                        backdrop:"#eee",
                        width: 800,
                        text: `이름 : ${result.value}, 스테이지 : ${record_s}, 시간 : ${record_t}`,
                        confirmButtonText: "확인",
                        confirmButtonColor: '#9c9f93'
                    }).then((result)=>{
                        stage=1;
                        location.href= "/good";
                    })
                })
            }
        })
        // 8스테이지 클리어 시 호스트에게 랭킹에 등록할 닉네임을 입력하는 대화상자 출력
        // 입력하면 닉네임, 죽을 당시 스테이지, 시간을 저장해서 server.js에 넘김 (맨 아래 쪽에 있음)
        // 8스테이지 클리어시 뜨는 화면

//---------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------------

    function renderStage(){
        ctx.beginPath();
        ctx.fillStyle = '#000000';
        ctx.font = '30px Arial';
        ctx.fillText(`Stage ${stage}`,30,30);
        ctx.closePath();
    }
        //좌측 상단 스테이지 표시

//---------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------------
        function renderPlayers(){
            let curPlayer = ballMap[myId];
            for (let i = 0; i < balls.length; i++) {
                    let ball = balls[i];
                    if (ball.getState() == 0){
                        continue
                    }
                    // 죽은 플레이어는 건너뛰기

                    ctx.beginPath();
                    ctx.fillStyle = ball.getColor();
                    ctx.arc(ball.getX(), ball.getY(), ball.getRadius(), 0, Math.PI * 2, false);
                    ctx.fill();
                    ctx.closePath();
                    // 캔버스에 공 띄우기

                    if( ball == curPlayer){
                        ctx.beginPath();
                        ctx.font = '15px Arial';
                        ctx.fillText(`${nickName}`,ball.getX()- ball.getRadius()-7, ball.getY() - ball.getRadius());
                        ctx.closePath();
                        //본인공에는 닉네임
                    }else{
                        ctx.beginPath();
                        ctx.font = '15px Arial';
                        ctx.fillText(`plater${i}`,ball.getX()- ball.getRadius()-7, ball.getY() - ball.getRadius());
                        ctx.closePath();
                        //나머지 = playerx >> 들어온 순서
                    }
                }
                
                if (rightPressed){
                    if (curPlayer.getX() <= 1024 - curPlayer.getRadius()){
                        curPlayer.setX(curPlayer.getX() + curPlayer.getPlayerSpeed());
                    }
                }
                // 우측 방향키 눌렀을 때 플레이어의 속도에 맞게 x좌표 변경 (우측 벽에 붙어있지 않은 경우만)
                if (leftPressed ){
                    if(curPlayer.getX() >= 0 + curPlayer.getRadius()){
                        curPlayer.setX(curPlayer.getX() - curPlayer.getPlayerSpeed());
                    }
                }
                // 좌측 방향키 눌렀을 때 플레이어의 속도에 맞게 x좌표 변경 (좌측 벽에 붙어있지 않은 경우만)
                if(upPressed ){
                    if(curPlayer.getY() >= 0 + curPlayer.getRadius()){
                        curPlayer.setY(curPlayer.getY() - curPlayer.getPlayerSpeed());
                    }
                }
                // 위쪽 방향키 눌렀을 때 플레이어의 속도에 맞게 y좌표 변경 (위쪽 벽에 붙어있지 않은 경우만)
                if(downPressed ){
                    if(curPlayer.getY() <= 768 - curPlayer.getRadius()){
                        curPlayer.setY(curPlayer.getY() + curPlayer.getPlayerSpeed());
                    }
                }
                // 아래 방향키 눌렀을 때 플레이어의 속도에 맞게 y좌표 변경 (아래 벽에 붙어있지 않은 경우만)
        }
        // 공에 이름들, 공의 움직임 설정

//---------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------------

        function renderEnemys(){
                for (let j = 0; j < enemys.length; j++){
                    let enemy = enemys[j];
                    ctx.beginPath();
                    ctx.fillStyle = enemy.getColor();
                    ctx.arc(enemy.getX(), enemy.getY(), enemy.getRadius(), 0, Math.PI *2, false);
                    ctx.fill();
                    ctx.closePath();
                }
                // 총알을 캔버스에 띄움

                for ( let k = 0 ; k < enemys.length; k++){ // 총알 개수만큼 반복
                    let enemy = enemys[k];
                    var distanceX = Math.abs(enemy.getDestinationX() - enemy.getInitialX());
                    var distanceY = Math.abs(enemy.getDestinationY() - enemy.getInitialY());
                    // 거리 = |도착지점 - 시작지점|
                    var speedY = distanceY/enemy.getAliveTime(); 
                    var speedX = distanceX/enemy.getAliveTime(); 
                    //AliveTime >> gameObject에서 설정, 총알 = 300, 아이템 = 1000
                    // 거리/300 >> 총알마다 속도가 다름 >> 거리가 달라도 같은 시간에 도착

                    enemy.setSpeedX(speedX);
                    enemy.setSpeedY(speedY);
                    // 총알 속도 설정
                    
                    if(stop_bulletsEffect){
                        items.length = 0;
                        enemy.setSpeedX(0);
                        enemy.setSpeedY(0);
                        enemy.setX(enemy.getX());
                        enemy.setY(enemy.getY());
                        if(Math.abs(stopTimer- timer) >= 3){
                            stop_bulletsEffect = false;
                        }
                    }
                    // 총알 정지 아이템 효과, 화면에 있는 아이템 전부 삭제, 총알 속도 0, 고정, 3초간 지속되고 꺼짐
                    // 

                    if(enemy.getWall() == 0){//leftSide
                        if (enemy.getDestinationY() >= enemy.getY()){
                            enemy.setX(enemy.getX() + enemy.getSpeedX());
                            enemy.setY(enemy.getY() + enemy.getSpeedY());
                        }
                        else{
                            enemy.setX(enemy.getX() + enemy.getSpeedX());
                            enemy.setY(enemy.getY() - enemy.getSpeedY());
                        }
                    }
                    // 왼쪽 벽 총알의 이동 좌표

                    else if (enemy.getWall() == 1){
                        if (enemy.getDestinationY() >= enemy.getY()){
                            enemy.setX(enemy.getX() - enemy.getSpeedX());
                            enemy.setY(enemy.getY() + enemy.getSpeedY());
                        }
                        else{
                            enemy.setX(enemy.getX() - enemy.getSpeedX());
                            enemy.setY(enemy.getY() - enemy.getSpeedY());
                        }
                    }
                    // 오른쪽 벽 총알 이동

                    else if (enemy.getWall() == 2){
                        if (enemy.getDestinationX() >= enemy.getX()){
                            enemy.setX(enemy.getX() + enemy.getSpeedX());
                            enemy.setY(enemy.getY() + enemy.getSpeedY());
                        }
                        else{
                            enemy.setX(enemy.getX() - enemy.getSpeedX());
                            enemy.setY(enemy.getY() + enemy.getSpeedY());
                        }
                    }
                    // 아래쪽 벽 총알 이동

                    else if (enemy.getWall() == 3){
                        if (enemy.getDestinationX() >= enemy.getX()){
                            enemy.setX(enemy.getX() + enemy.getSpeedX());
                            enemy.setY(enemy.getY() - enemy.getSpeedY());
                        }
                        else{
                            enemy.setX(enemy.getX() - enemy.getSpeedX());
                            enemy.setY(enemy.getY() - enemy.getSpeedY());
                        }
                    }
                    // 위쪽 벽 총알 이동
                        
                    if (enemy.getX() < -100 || enemy.getX() > 1400 || enemy.getY() < -100 || enemy.getY() > 1400){
                        enemys.splice(k,1);
                    }
                    // 총알의 좌표가 캔버스를 벗어나면 삭제
                }
        }

//---------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------------

        function renderStraightEnemys(){
            for (let j = 0; j < straightEnemys.length; j++){
                    let straightEnemy = straightEnemys[j];
                    ctx.beginPath();
                    ctx.fillStyle = straightEnemy.getColor();
                    ctx.arc(straightEnemy.getX(), straightEnemy.getY(), straightEnemy.getRadius(), 0, Math.PI *2, false);
                    ctx.fill();
                    ctx.closePath();

                }
                for ( let k = 0 ; k < straightEnemys.length; k++){
                    let straightEnemy = straightEnemys[k];
                    var distanceX = Math.abs(straightEnemy.getDestinationX() - straightEnemy.getInitialX());
                    var distanceY = Math.abs(straightEnemy.getDestinationY() - straightEnemy.getInitialY());
                    var speedY = distanceY/straightEnemy.getAliveTime()/1.5;
                    var speedX = distanceX/straightEnemy.getAliveTime()/1.5;
                    if(straightEnemy.getWall() == 0){//leftSide
                        if (straightEnemy.getDestinationY() >= straightEnemy.getY()){
                            straightEnemy.setX(straightEnemy.getX() + speedX);
                            straightEnemy.setY(straightEnemy.getY() + speedY);
                        }
                        else{
                            straightEnemy.setX(straightEnemy.getX() + speedX);
                            straightEnemy.setY(straightEnemy.getY() - speedY);
                        }
                    }
                    else if (straightEnemy.getWall() == 1){
                        if (straightEnemy.getDestinationY() >= straightEnemy.getY()){
                            straightEnemy.setX(straightEnemy.getX() - speedX);
                            straightEnemy.setY(straightEnemy.getY() + speedY);

                        }
                        else{
                            straightEnemy.setX(straightEnemy.getX() - speedX);
                            straightEnemy.setY(straightEnemy.getY() - speedY);

                        }
                    }
                    else if (straightEnemy.getWall() == 2){
                        if (straightEnemy.getDestinationX() >= straightEnemy.getX()){
                            straightEnemy.setX(straightEnemy.getX() + speedX);
                            straightEnemy.setY(straightEnemy.getY() + speedY);
                        }
                        else{
                            straightEnemy.setX(straightEnemy.getX() - speedX);
                            straightEnemy.setY(straightEnemy.getY() + speedY);
                        }
                    }
                    else if (straightEnemy.getWall() == 3){
                        if (straightEnemy.getDestinationX() >= straightEnemy.getX()){
                            straightEnemy.setX(straightEnemy.getX() + speedX);
                            straightEnemy.setY(straightEnemy.getY() - speedY);
                        }
                        else{
                            straightEnemy.setX(straightEnemy.getX() - speedX);
                            straightEnemy.setY(straightEnemy.getY() - speedY);
                        }
                    }
                    
                    if (straightEnemy.getX() < -100 || straightEnemy.getX() > 1400 || straightEnemy.getY() < -100 || straightEnemy.getY() > 1400){
                        straightEnemys.splice(k,1);
                    }
                }
                
        }
        // 속도 부분 빼면 똑같음

//---------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------------

        function renderItems(){
            for (let j = 0; j < items.length; j++){
                    let item = items[j];
                    if(item.getName() == "delete_bullets"){
                        ctx.beginPath();
                        ctx.fillStyle = item.getColor("delete_bullets");
                        ctx.arc(item.getX(), item.getY(), item.getRadius(), 0, Math.PI *2, false);
                        ctx.fill();
                        ctx.closePath();


                        ctx.beginPath();
                        ctx.font = '15px Arial';
                        ctx.fillStyle = '#6f4e37';
                        ctx.fillText(`DELETE_BULLET`, item.getX()-item.getRadius()-20,item.getY()-item.getRadius());
                        ctx.closePath();
                    }
                    // 커피 이름 설정해서 캔버스에 띄우기

                    else if(item.getName() == "stop_bullets"){
                        ctx.beginPath();
                        ctx.fillStyle = item.getColor("stop_bullets");
                        ctx.arc(item.getX(), item.getY(), item.getRadius(), 0, Math.PI *2, false);
                        ctx.fill();
                        ctx.closePath();

                        ctx.beginPath();
                        ctx.font = '15px Arial';
                        ctx.fillStyle = '#0067a3';
                        ctx.fillText(`STOP_BULLET`, item.getX()-item.getRadius()-20,item.getY()-item.getRadius());
                        ctx.closePath();
                    }
                    // 총알 정지 이름 설정해서 캔버스에 띄우기

                }
                for ( let k = 0 ; k < items.length; k++){
                    let item = items[k];
                    var distanceX = Math.abs(item.getDestinationX() - item.getInitialX());
                    var distanceY = Math.abs(item.getDestinationY() - item.getInitialY());
                    var speedY = distanceY/item.getAliveTime();
                    var speedX = distanceX/item.getAliveTime(); // AliveTime = 1000
                    if(item.getWall() == 0){//leftSide
                        if (item.getDestinationY() >= item.getY()){
                            item.setX(item.getX() + speedX);
                            item.setY(item.getY() + speedY);
                        }
                        else{
                            item.setX(item.getX() + speedX);
                            item.setY(item.getY() - speedY);
                        }
                    }
                    else if (item.getWall() == 1){
                        if (item.getDestinationY() >= item.getY()){
                            item.setX(item.getX() - speedX);
                            item.setY(item.getY() + speedY);
                        }
                        else{
                            item.setX(item.getX() - speedX);
                            item.setY(item.getY() - speedY);

                        }
                    }
                    else if (item.getWall() == 2){
                        if (item.getDestinationX() >= item.getX()){
                            item.setX(item.getX() + speedX);
                            item.setY(item.getY() + speedY);
                        }
                        else{
                            item.setX(item.getX() - speedX);
                            item.setY(item.getY() + speedY);
                        }
                    }
                    else if (item.getWall() == 3){
                        if (item.getDestinationX() >= item.getX()){
                            item.setX(item.getX() + speedX);
                            item.setY(item.getY() - speedY);

                        }
                        else{
                            item.setX(item.getX() - speedX);
                            item.setY(item.getY() - speedY);
                        }
                    }
                    
                    if (item.getX() < -100 || item.getX() > 1400 || item.getY() < -100 || item.getY() > 1400){
                        items.splice(k,1);
                    }
                }
        }
        // 아이템 이름 변경할 때 여기서
        // 속도 빼고 위랑 똑같음

//---------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------------

        let timer = 15.00;
        function renderTimer(){
            ctx.beginPath();
            ctx.fillStyle = '#000000';
            ctx.font = '20px Arial';
            ctx.fillText(`Timer ${timer.toFixed(2)}`,30,50);
            ctx.closePath();
        }
        //타이머 표시

//---------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------------
        function renderClearMessage(){
            ctx.beginPath();
            ctx.fillStyle = '#000000';
            ctx.font = '50px Arial';
            ctx.fillText(`스테이지 ${stage-1} 클리어!!`,1024/2-190, 730-50);
            ctx.fillText(`5초 후 다음 라운드가 시작됩니다.`,1024/2-375, 730);
            ctx.closePath();
        }
        // 스테이지 클리어시 게임 화면 하단에 뜨는 메시지
        //수정

//---------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------------

        function renderGame() {            

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // 캔버스에 그려진 그림 지우는거라는데 이거 왜 있는거임?

                collisionDetection();  //총알 충돌판정
                renderStage();  // 스테이지 표시
                renderPlayers();  // 플레이어의 위치 표시
                renderEnemys();  // 총알 표시
                renderStraightEnemys();  // 총알 표시
                renderItems();  // 아이템 표시
                renderTimer();  // 타이머 표시

    
                if(stageClear){
                    renderClearMessage();
                }
                // 스테이지 클리어시 캔버스 하단에 메시지 표시


                acquireDetection(); // 아이템 충돌 판정
                if(delete_bulletsEffect){
                    enemys.length = 0;
                    straightEnemys.length = 0;
                    items.length = 0;
                    delete_bulletsEffect = false;
                }
                // 총알 제거 효과 : 총알, 아이템 삭제, 총알 제거 효과 제거

                if(balls.length){
                    sendData();
                }
                // 공이 남아있다면 계속해서 위치 공유

                if(isStart){
                    timer -= 0.010;
                    if(parseInt(timer) <= 0){
                        timer = 0;
                    }
                }
                renderTimer();
                
                // 이 함수가 0.01초에 한번씩 반복되므로 반복될 때마다 0.01초씩 감소시켜서 표시
        }
        
//---------------------------------------------------------------------------------------------------------------------------------------------

        var isStart = false; // 초기 설정 : 대기상태로 시작

//---------------------------------------------------------------------------------------------------------------------------------------------

        function update() {
            renderGame();
        }
        setInterval(update, 10);
        //0.01초마다 한번씩 함수를 반복

//---------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------------

        function start(){
            if(!isStart){
                socket.emit('start', { id: myId, stage : stage, waiting : false, isStart : true});
            }
        }
        // gamePage.html(게임화면)에서 시작 버튼을 누르고 게임이 시작되지 않은 상태라면
        // 데이터를 전송 >> 누른게 host인지 구분하기 위함

        socket.on('start_game', function(){
            isStart = true;
            let bgm = document.getElementById("bgm");
            bgm.volume = 0.3;
            bgm.play();
        })
        // 누른게 호스트였으면 실행 >> 게임 시작, 브금 실행

//---------------------------------------------------------------------------------------------------------------------------------------------
        
        let stageClear = false; // 스테이지 클리어시 true로 바뀜

//---------------------------------------------------------------------------------------------------------------------------------------------

        socket.on('stage_clear',function(data){//스테이지 하나가 끝난 상태
            stageClear = true; // 스테이지 클리어
            enemys.length = 0;  // 총알 없애기
            straightEnemys.length = 0; // 총알 없애기
            items.length = 0; // 아이템 없애기
            for (var i = 0 ; i < balls.length ; i++){
                if( balls[i].getState() == 0){
                    balls[i].setX(1024/2);
                    balls[i].setY(768/2);
                    balls[i].setState(1);
                }
            } 
            // 죽은애들 캔버스 가운데서 부활

            isStart = false; // 대기상태
            socket.emit('start', { id: myId, stage : stage, waiting : true});//웨이팅 스테이지로 이동
            stage = data.stage;//스테이지 1 업 시켜주기
        })

//---------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------------

        socket.on('end_waiting', function(){ //웨이팅이 끝난상태
            timer = 15; // 타이머 초기화
            stageClear = false; // 다시 변경
            isStart = false; 
            socket.emit('start', { id: myId, stage : stage, waiting : false});  // 다음 스테이지 이동          
        })

//---------------------------------------------------------------------------------------------------------------------------------------------