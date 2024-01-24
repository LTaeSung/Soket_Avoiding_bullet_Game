/* 
    socket.emit('이름', 보낼 데이터), io.sockets.emit('이름', 보낼 데이터) >> 서버로 데이터를 보냄
    socket.on('이름', function(){받은 데이터를 이용한 함수}) >> 서버에서 이름에 맞는 데이터 받아옴
    
    socket.broadcast.emit >> 나를 제외한 다른 사람에게 보냄

    emit으로 데이터 보내고 on으로 받아서 사용 

    server.js랑 gamePage.js에서 데이터 주고 받을 때 사용
*/


//server.js
var name =[];
var stage=[];
var time=[];

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { isContext } = require('vm');

server.listen( process.env.PORT||8000, () => {
    console.log("서버가 대기중입니다.");
}) 
//8000포트에서 실행

app.use(express.static('views'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
}) 
// localhost:8000/에는 index.html (닉네임 설정 화면)

app.get('/good', (req, res) => {
    res.sendFile(__dirname + '/views/goodEndingPage.html');
})
// localhost:8000/good 에는 goodEndingPage.html (모든 스테이지 클리어 시)

app.get('/bad', (req, res) => {
    res.sendFile(__dirname + '/views/badEndingPage.html');
})
// localhost:8000/bad 에는 badEndingPage.html (모든 플레이어가 충돌했을 시)

app.get('/game', (req, res) => {
    res.sendFile(__dirname + '/views/gamePage.html');
})
// localhost:8000/game 에는 gamePage.html (게임화면)

app.get('/rank', (req, res) => {
    res.sendFile(__dirname + '/views/ranking.html');
})
// localhost:8000/rank 에는 ranking.html (랭킹창 구현x)

app.get('/guest', (req, res) => {
    res.sendFile(__dirname + '/views/guestPage.html');
})
// localhost:8000/guest 에는 guestPage.html (방명록 구현x)



app.use('/views/sounds/InvisibleSizeDown.mp3', express.static(__dirname+ '/views/sounds/InvisibleSizeDown.mp3'));
app.use('/views/keyHandler', express.static(__dirname+ '/views/keyHandler.js'))
app.use('/views/gameObject', express.static(__dirname+ '/views/gameObject.js'))
app.use('/stage/stageHandler', express.static(__dirname + '/stage/stageHandler.js'))
// 음성파일, 작성된 js파일 사용하기, 마지막거는 없는 파일 같음



function getPlayerColor(){
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
}
// 16777215 = FFFFFF를 10진수로 변환한 값, 공 색 랜덤 지정하는데 사용


const canvasWidth = 1024;
const canvasHeight = 768;
// 캔버스 크기

let enemyFrequency = 1000;
// 총알 생성 주기(라운드가 높아질 수록 줄어듬)

const startX = canvasWidth/2;
const startY = canvasHeight/2;
// 플레이어가 처음 시작할 위치 (캔버스 한 가운데)

let isStart = false;
// localhost:8000/game (게임화면)에 처음 입장 시 대기 상태



class Stage{ // 스테이지 클래스
    constructor(stage){
        this.stage = stage || null;
    }
    setStage(stage){
        return this.stage = stage;
    }
    // 예시 >> Stage.setStage(stageOne) >> 스테이지 1 세팅으로 설정
    start(){
        this.stage.start();
    }
    // Stage.start() >> 설정된 대로 게임 시작
}



var enemyRadius = 10;
// 총알의 반지름 >> 나중에 적 생성할 때 쓰임

class PlayerBall{
    constructor(socket){
        this.socket = socket;
        this.x = startX;
        this.y = startY;
        this.color = getPlayerColor();
        this.state = 1;
    }

    get id() {
        return this.socket.id;
    }
}
// 초기 설정 : 시작 좌표 : 한가운데 / 색 : 랜덤 / 스테이지 : 1
// PlayerBall.id 하면 socket.id값 받아옴


var balls = [];  // PlayerBall을 담을 객체
var ballMap = {};  // socket에 접속했을때 부여되는 id를 통해 해당 ball을 찾을 수 있는 객체

function joinGame(socket){
    let ball = new PlayerBall(socket);

    balls.push(ball); // 배열에 새로운 PlayerBall 추가
    ballMap[socket.id] = ball; // socket.id를 이용해 PlayerBall 저장

    return ball;
}
// 새로운 플레이어가 입장 시 배열에 저장

function endGame(socket){
    for( var i = 0 ; i < balls.length; i++){
        if(balls[i].id == socket.id){
            balls.splice(i,1);
            break
        }
    }
    delete ballMap[socket.id];
}
// 게임 나가면 id로 배열에서 찾아서 제거

let isAccessFail = false;
// 7명 이상 접속 시, 게임 도중일 경우 차단 필요 >> 구분 위해 변수 선언

let enemyInterval;
// 스테이지 설정할 때 총알 생성 간격, 패턴(총알, 일렬로 날아오는 총알, 아이템)등 설정하는데 쓰임


io.on('connection', function(socket) { // connection = 입장 시 자동 발생
    console.log(`${socket.id}님이 입장하셨습니다.`); 

    socket.on('disconnect', function(reason){ //퇴장 시 자동 발생
        console.log(`${socket.id}님이 ${reason}의 이유로 퇴장하셨습니다. `)
        endGame(socket);
        //나가면 공 제거 위해 endGame 실행
        io.sockets.emit('leave_user', socket.id);
        // gamePage.js에서 플레이어가 저장된 배열을 삭제하는데 이용 >> server.js에 있는 endGame()과 같은 역할
        
        if(balls.length == 0){ 
            isStart = false;
            clearInterval(enemyInterval);
            timer = 15;
            isAccessFail = false;
        }
        // 플레이어가 0명일 때, 대기상태로 변경, 총알 생성 함수 제거, 타이머 초기화, 접속 가능하도록 변경
    });


    
    let newBall = joinGame(socket);
    // 접속한 플레이어 정보 받아옴 >> gamePage에 전달할 때 사용

    socket.emit('user_id', socket.id);
    // gamePage.js에서 본인의 id를 저장하는데 이용


    for (var i = 0 ; i < balls.length; i++){
        let ball = balls[i];
        socket.emit('join_user', {
            id: ball.id,
            x: ball.x,
            y: ball.y,
            color: ball.color,
        });
    }
    // 반복문을 사용하여 접속해 있던 플레이어의 공 정보들을 하나씩 서버로 보냄
    // 새로운 플레이어에게 이미 접속해있던 유저들의 정보를 전달하기 위함

    socket.broadcast.emit('join_user',{
        id: socket.id,
        x: newBall.x,
        y: newBall.y,
        color: newBall.color,
    });
    // 접속한 본인을 제외한 모두에게 접속한 플레이어의 공 정보들을 전달


//---------------------------------------------------------------------------------------------------------------------------------------------

    if(balls.length > 7 || isAccessFail){ // 7명 이상 접속 || 게임중 일 때
        console.log(socket.id)
        socket.emit('force_disconnect', socket.id); // 차단할 플레이어 아이디 전달 >> gamePage.js에서 받아서 차단

        endGame(socket); // 차단되기 전에 공이 먼저 저장되므로 endGame으로 플레이어 배열에서 삭제

        io.sockets.emit('leave_user', socket.id); // gamePage.js에서도 플레이어 배열에서 삭제

        socket.disconnect(false); // 연결을 닫은 다음 이 소켓을 다시 사용할 수 없게 하는거라는데.. 뭔말인지 모름
    }

    // 7명 이상, 게임중일 때 접속 차단하는데 쓰임


//---------------------------------------------------------------------------------------------------------------------------------------------


    socket.on('send_location', function(data) {
            socket.broadcast.emit('update_state', {
                id: data.id,
                x: data.x,
                y: data.y,
            })
    })
    // 받은 데이터 >> 본인의 id, 본인이 이동한 좌표
    // 받은 정보를 나를 제외한 다른 사람들에게 그대로 다시 보냄 >> 모두가 데이터를 보내면 결국 나는 나를 제외한 다른 사람의 좌표를 얻을 수 있음
    // 다른사람의 공를 내 화면에 표시하는데 사용


    function enemyLeftSideGenerator(){
            if(balls.length){
                var randomStartY = Math.floor(Math.random() * 768)
                var randomDestinationY = Math.floor(Math.random() * 768)
                io.sockets.emit('enemy_generator', {
                    wall : 0,
                    startingX:  enemyRadius,
                    startingY:  randomStartY,
                    destinationX:  canvasWidth+enemyRadius,
                    destinationY: randomDestinationY,
                })
            }
    }
    // 총알 생성, 시작 : 왼쪽 벽 랜덤 위치,  목적지 : 오른쪽 벽 랜덤위치

    function enemyRightSideGenerator(){
            if(balls.length){
                var randomStartY = Math.floor(Math.random() * 768)
                var randomDestinationY = Math.floor(Math.random() * 768)
                io.sockets.emit('enemy_generator', {
                    wall : 1,
                    startingX:  canvasWidth+enemyRadius,
                    startingY:  randomStartY,
                    destinationX:  enemyRadius,
                    destinationY: randomDestinationY,
                })
            }
    }
    // 시작 : 오른쪽 벽 랜덤위치,  목적지 : 왼쪽 벽 랜덤위치

    function enemyUpSideGenerator(){
            if(balls.length){
                var randomStartX = Math.floor(Math.random() * 1024);
                var randomDestinationX = Math.floor(Math.random() * 1024);
                io.sockets.emit('enemy_generator', {
                    wall : 2,
                    startingX:  randomStartX,
                    startingY:  enemyRadius,
                    destinationX:  randomDestinationX,
                    destinationY: canvasHeight+enemyRadius,
                })
            }
    }
    // 시작 : 아래쪽 벽 랜덤위치,  목적지 : 위쪽 벽 랜덤위치

    function enemyDownSideGenerator(){
            if(balls.length){
                var randomStartX = Math.floor(Math.random() * 1024);
                var randomDestinationX = Math.floor(Math.random() * 1024);
                io.sockets.emit('enemy_generator', {
                    wall : 3,
                    startingX:  randomStartX,
                    startingY:  canvasHeight+enemyRadius,
                    destinationX:  randomDestinationX,
                    destinationY: enemyRadius,
                })
            }
    }
    // 시작 : 위쪽 벽 랜덤위치, 목적지 : 아래쪽 벽 랜덤위치

    function enemyGenerator(){
        enemyLeftSideGenerator();
        enemyRightSideGenerator();
        enemyUpSideGenerator();
        enemyDownSideGenerator();
    }
    //각 함수에서 생성위치와 도착위치를 보내면 gamePage.js에서 받아서 총알 생성

    function straightEnemyLeftSideGenerator(){
        if(balls.length){
            for(var i=0; i<9; i++){
                var y = 30 + enemyRadius + i*84;
                io.sockets.emit('straight_enemy_generator', {
                    wall : 0,
                    startingX:  enemyRadius,
                    startingY:  y,
                    destinationX:  canvasWidth+enemyRadius,
                    destinationY: y,
                })
            }
            var randomStartY = Math.floor(Math.random() * 768)
            var randomDestinationY = Math.floor(Math.random() * 768)
            io.sockets.emit('enemy_generator', {
                wall : 0,
                startingX:  enemyRadius,
                startingY:  randomStartY,
                destinationX:  canvasWidth+enemyRadius,
                destinationY: randomDestinationY,
            })
        }
    }
    // 왼쪽에서 오른쪽으로 일렬로 날아가는 총알 9개 생성

    function straightEnemyRightSideGenerator(){
        if(balls.length){
            for(var i=0; i<9; i++){
                var y = 30 + enemyRadius + i * 84;
                io.sockets.emit('straight_enemy_generator',{
                    wall : 1,
                        startingX:  canvasWidth+enemyRadius,
                        startingY:  y,
                        destinationX:  enemyRadius,
                        destinationY: y, 
                })
            }
        }
    }
    // 오른쪽에서 왼쪽으로 9개
    
    function straightEnemyUpSideGenerator(){
        if(balls.length){
            for(var i=0; i<12; i++){
                var x = 30 + enemyRadius + i* 84;
                io.sockets.emit('straight_enemy_generator', {
                    wall : 2,
                    startingX:  x,
                    startingY:  enemyRadius,
                    destinationX:  x,
                    destinationY: canvasHeight+enemyRadius,
                })
            }
        }
    }
    // 아래에서 위로 12개

    function straightEnemyDownSideGenerator(){
        if(balls.length){
            for(var i=0; i<12; i++){
                var x = 30+ enemyRadius + i * 84;
                io.sockets.emit('straight_enemy_generator', {
                    wall : 3,
                    startingX:  x,
                    startingY:  canvasHeight+enemyRadius,
                    destinationX:  x,
                    destinationY: enemyRadius,
                })
            }
        }
    }
    // 위에서 아래로 12개

    function straightEnemyGenerator(stage){
        var random = Math.floor(Math.random() * 2)
        if(stage == 1){
            if(random == 1){
                straightEnemyRightSideGenerator();
            }
            else{
                straightEnemyLeftSideGenerator();
            }
        }
        else if(stage == 0){
            if(random == 1){
                straightEnemyDownSideGenerator();
            }
            else{
                straightEnemyUpSideGenerator();
            }
        } 
    } 
    // straightEnemyGenerator(1)일 경우 위, 아래
    // straightEnemyGenerator(0)일 경우 오른쪽, 왼쪽
    // 각 함수에서 생성위치와 도착위치를 보내면 gamePage.js에서 받아서 총알 생성


    const WaitingStage = (function(){//전략패턴 사용
        function WaitingStage(){}
        WaitingStage.prototype.start = function(){
            let count = 0;
            waitInterval = setInterval(function() {
                count += 1;
                if(count >= 5){
                    clearInterval(waitInterval);
                    io.sockets.emit('end_waiting');
                }
            }, 1000);
        };
        return WaitingStage;
    })();
    // 스테이지와 스테이지 사이 5초간 기다리는 시간
    // end_waiting >> gamePage.js에서 받아서 타이머 초기화, 클리어 하면서 바뀐 설정 다시 초기화
    
    let itemTime = 5;
    const StageOne = (function(){//전략패턴 사용
        function StageOne(){}
        StageOne.prototype.start = function(){
            let count = 0;
            let stage = 1;
            let itemMaximum = 1;
            let itemCount = 0;
            enemyFrequency = 1000;
            enemyInterval = setInterval(function () {
                count+=1;
                enemyGenerator();
                if(Math.floor(count) >= itemTime && itemCount < itemMaximum ){
                    console.log(count);
                    itemGenerator("stop_bullets");
                    itemCount++;
                }
                if (Math.floor(count) >= 15){
                    clearInterval(enemyInterval);
                    for (var i = 0 ; i < balls.length ; i++){
                            balls[i].state = 1;
                        }
                    io.sockets.emit('stage_clear', {stage : stage+1});
                }
            }, enemyFrequency);
        };
        return StageOne;
    })();
    // 1초마다 반복해서 총알 생성, 15번 반복되면 모든 공 부활, 스테이지+1
    // 0초가 되면 클리어가 아니라 설정된만큼 반복을 해야 클리어 되는 것

    const StageTwo = (function(){//전략패턴 사용
        function StageTwo(){}
        StageTwo.prototype.start = function(){
            let count = 0;
            let stage = 2;
            let itemMaximum = 1;
            let itemCount = 0;
            enemyFrequency = 900;
            enemyInterval = setInterval(function () {
                enemyGenerator();
                count += 1;
                
                if(Math.floor(count) >= itemTime && itemCount < itemMaximum ){
                    console.log(count);
                    itemGenerator("stop_bullets");
                    itemCount++;
                }
                if (Math.floor(count) >= 17){
                    clearInterval(enemyInterval);
                    for (var i = 0 ; i < balls.length ; i++){
                        balls[i].state = 1;
                    }
                    io.sockets.emit('stage_clear', {stage : stage+1});
                }
            }, enemyFrequency);
        };
        return StageTwo;
    })();
    //0.9초마다 총알 생성, 카운트가 5번(itemTime)이상이고 생성된 아이템이 1개 미만인 경우 총알 정지 아이템 생성
    //17번 반복되면 모든 공 부활, 스테이지+1

    const StageThree = (function(){//전략패턴 사용
        function StageThree(){}
        StageThree.prototype.start = function(){
            let count = 0;
            let stage = 3;
            let itemMaximum = 1;
            let itemCount = 0;
            enemyFrequency = 800;
            enemyInterval = setInterval(function () {
                enemyGenerator();
                count += 1;

                if(Math.floor(count) >= itemTime && itemCount < itemMaximum ){
                    console.log(count);
                    itemGenerator("stop_bullets");
                    itemCount++;
                }
                if(count == 5){
                    straightEnemyGenerator(1);
                }
                if (Math.floor(count) >= 19){
                    clearInterval(enemyInterval);
                    for (var i = 0 ; i < balls.length ; i++){
                        balls[i].state = 1;
                    }
                    io.sockets.emit('stage_clear', {stage : stage+1});
                }
            }, enemyFrequency);
        };
        return StageThree;
    })();
    //0.8초마다 한번씩 총알 생성, 5번 반복되면 일렬로 총알 발사(위 or 아래), 카운트 5번 이상이고 아이템이 1개 미만인 경우 총알 정지 생성
    //19번 반복되면 전원부활, 스테이지 +1

    const StageFour = (function(){//전략패턴 사용
        function StageFour(){}
        StageFour.prototype.start = function(){
            let count = 0;
            let stage = 4;
            let itemMaximum = 1;
            let itemCount = 0;
            enemyFrequency = 700;
            enemyInterval = setInterval(function () {
                enemyGenerator();
                count += 1;

                if(Math.floor(count) >= itemTime && itemCount < itemMaximum ){
                    console.log(count);
                    itemGenerator("delete_bullets");
                    itemCount++;
                }
                if(count == 5){
                    straightEnemyGenerator(0);
                }
                if (Math.floor(count) >= 22){
                    clearInterval(enemyInterval);
                    for (var i = 0 ; i < balls.length ; i++){
                        balls[i].state = 1;
                    }
                    io.sockets.emit('stage_clear', {stage : stage+1});
                }
            }, enemyFrequency);
        };
        return StageFour;
    })();


    const StageFive = (function(){//전략패턴 사용
        function StageFive(){}
        StageFive.prototype.start = function(){
            let count = 0;
            let stage = 5;
            let itemMaximum = 1;
            let itemCount = 0;
            enemyFrequency = 600;
            enemyInterval = setInterval(function () {
                enemyGenerator();
                count += 1;

                if(Math.floor(count) >= itemTime && itemCount < itemMaximum ){
                    console.log(count);
                    itemGenerator("delete_bullets");
                    itemCount++;
                }
                if(count == 4 || count == 9){
                    straightEnemyGenerator(1);
                }
                if (Math.floor(count) >= 26){
                    clearInterval(enemyInterval);
                    for (var i = 0 ; i < balls.length ; i++){
                        balls[i].state = 1;
                    }
                    io.sockets.emit('stage_clear', {stage : stage+1});
                }
            }, enemyFrequency);
        };
        return StageFive;
    })();
    

    const StageSix = (function(){//전략패턴 사용
        function StageSix(){}
        StageSix.prototype.start = function(){
            let count = 0;
            let stage = 6;
            let itemMaximum = 1;
            let itemCount = 0;
            enemyFrequency = 550;
            enemyInterval = setInterval(function () {
                enemyGenerator();
                count += 1;

                if(Math.floor(count) >= itemTime && itemCount < itemMaximum ){
                    console.log(count);
                    itemGenerator("delete_bullets");
                    itemCount++;
                }
                if(count == 4 || count == 9){
                    straightEnemyGenerator(0);
                }
                if (Math.floor(count) >= 28){
                    clearInterval(enemyInterval);
                    for (var i = 0 ; i < balls.length ; i++){
                        balls[i].state = 1;
                    }
                    io.sockets.emit('stage_clear', {stage : stage+1});
                }
            }, enemyFrequency);
        };
        return StageSix;
    })();

    const StageSeven = (function(){//전략패턴 사용
        function StageSeven(){}
        StageSeven.prototype.start = function(){
            let count = 0;
            let stage = 7;
            let itemMaximum = 1;
            let itemCount = 0;
            enemyFrequency = 500;
            enemyInterval = setInterval(function () {
                enemyGenerator();
                count += 1;

                if(Math.floor(count) >= itemTime && itemCount < itemMaximum ){
                    console.log(count);
                    itemGenerator("delete_bullets");
                    itemCount++;
                }
                if(count == 3 || count == 6 || count == 9){
                    if (count == 6){
                        straightEnemyGenerator(0);    
                    }
                    else{
                        straightEnemyGenerator(1);
                    }
                }
                if (Math.floor(count) >= 31){
                    clearInterval(enemyInterval);
                    for (var i = 0 ; i < balls.length ; i++){
                        balls[i].state = 1;
                    }
                    io.sockets.emit('stage_clear', {stage : stage+1});
                }
            }, enemyFrequency);
        };
        return StageSeven;
    })();

    const StageEight = (function(){//전략패턴 사용
        function StageEight(){}
        StageEight.prototype.start = function(){
            let count = 0;
            let stage = 8;
            let itemMaximum = 1;
            let itemCount = 0;
            enemyFrequency = 450;
            enemyInterval = setInterval(function () {
                enemyGenerator();
                count += 1;
                if(Math.floor(count) >= itemTime && itemCount < itemMaximum ){
                    console.log(count);
                    itemGenerator("delete_bullets");
                    itemCount++;
                }
                if(count == 3 || count == 6 || count == 9){
                    if (count == 6){
                        straightEnemyGenerator(0);    
                    }
                    else{
                        straightEnemyGenerator(1);
                    }
                }
                if (Math.floor(count) >= 34){
                    clearInterval(enemyInterval);
                    for (var i = 0 ; i < balls.length ; i++){
                        balls[i].state = 1;
                    }
                    io.sockets.emit('game_win');
                }
            }, enemyFrequency);
        };
        return StageEight;
    })();
    // 클리어시 game_win >> 클리어 대화상자, goodEndingPage로 연결시켜 줌

    let stageStrategy = new Stage();
    let stageOne = new StageOne;
    let waitingStage = new WaitingStage;
    let stageTwo = new StageTwo;
    let stageThree = new StageThree;
    let stageFour = new StageFour;
    let stageFive = new StageFive;
    let stageSix = new StageSix;
    let stageSeven = new StageSeven;
    let stageEight = new StageEight;

    let host = balls[0].id;
    if(isStart == false){ // 대기상태(처음 입장) or waitingStage 일 때
        socket.on('start', function(data){ //id: myId, stage : stage, waiting : false, isStart : true 받아옴 
            isAccessFail= true; // 접속 차단
            isStart = data.isStart; //isStart true로 변경
            if(host == data.id){ // 버튼 누른놈이 호스트인 경우
                if(data.waiting == false){ // 대기상태가 끝났을 때 스테이지 설정 후 시작
                    if(data.stage == 1){
                        io.sockets.emit('start_game'); // gamePage.js에서 받아서 isStart = true로 설정, 브금 재생
                        stageStrategy.setStage(stageOne);
                        stageStrategy.start();
                    }
                    else if(data.stage == 2){
                        io.sockets.emit('start_game');
                        stageStrategy.setStage(stageTwo);
                        stageStrategy.start();
                    }
                    else if(data.stage == 3){
                        io.sockets.emit('start_game');
                        stageStrategy.setStage(stageThree);
                        stageStrategy.start();
                    }
                    else if(data.stage == 4){
                        io.sockets.emit('start_game');
                        stageStrategy.setStage(stageFour);
                        stageStrategy.start();
                    }
                    else if(data.stage == 5){
                        io.sockets.emit('start_game');
                        stageStrategy.setStage(stageFive);
                        stageStrategy.start();
                    }
                    else if(data.stage == 6){
                        io.sockets.emit('start_game');
                        stageStrategy.setStage(stageSix);
                        stageStrategy.start();
                    }
                    else if(data.stage == 7){
                        io.sockets.emit('start_game');
                        stageStrategy.setStage(stageSeven);
                        stageStrategy.start();
                    }
                    else if(data.stage == 8){
                        io.sockets.emit('start_game');
                        stageStrategy.setStage(stageEight);
                        stageStrategy.start();
                    }
                }else
                {
                    stageStrategy.setStage(waitingStage);
                    stageStrategy.start();
                }
                // 대기상태일 시 waitingStage 설정
            }
    
        })
    
    }
    // 날아오는 총알 생성하는 역할

    socket.on('collision_detect', function(data){
        for( var i = 0 ; i < balls.length; i++){
            if(balls[i].id == data.id){
                balls[i].state = 0;
                break;
            }
        }
        // 충돌한 공의 id를 받아와서 공을 죽은 상태(state = 0)로 변경

        socket.broadcast.emit('collision_update', {id : data.id})
        // 충돌하면 다른 사람들에게 id를 전달 >> 다른 사람들도 내 공의 상태를 죽은 상태로 변경

        isFail = stageFail();
        // 전원이 총알에 충돌했을 시 true, 1명이라도 살아있으면 false인 함수

        if(isFail){
            io.sockets.emit('game_over', {isFail: true})
        }
        // 전원 사망시 isFail: true 전달 >> 대화상자 출력하고 badEndingPage로 넘어감
    })

    socket.on('item_detect', function(data){
        if(data.name == "delete_bullets"){
            io.sockets.emit('delete_bullets_effect', {delete_bullets : true});
        }
        else if(data.name == "stop_bullets"){
            io.sockets.emit('stop_bullets_effect',{stop_bullets : true});
        }
    })
    // 충돌한 아이템의 종류를 전달받고 효과를 true로 변경해서 전달

    const itemRadius=20;
    // 아이템 크기

    function itemLeftSideGenerator(name){ // 아이템 생성, 방식은 총알 생성과 같음
        if(balls.length){
            var randomStartY = Math.floor(Math.random() * 768)
            var randomDestinationY = Math.floor(Math.random() * 768)
            if(name == "delete_bullets"){
                io.sockets.emit('item_generator', {
                    wall: 0,
                    startingX: itemRadius,
                    startingY: randomStartY,
                    destinationX: canvasWidth+itemRadius,
                    destinationY: randomDestinationY,
                    name : name
                })
            }
            else if(name == "stop_bullets"){
                io.sockets.emit('item_generator', {
                    wall: 0,
                    startingX: itemRadius,
                    startingY: randomStartY,
                    destinationX: canvasWidth+itemRadius,
                    destinationY: randomDestinationY,
                    name : name
                })
            }

        }
    }

    function itemRightSideGenerator(name){
        if(balls.length){
            var randomStartY = Math.floor(Math.random() * 768)
            var randomDestinationY = Math.floor(Math.random() * 768)
            if(name == "delete_bullets"){
                io.sockets.emit('item_generator', {
                    wall: 1,
                    startingX: canvasWidth+itemRadius,
                    startingY: randomStartY,
                    destinationX: itemRadius,
                    destinationY: randomDestinationY,
                    name : name
                })
            }
            else if(name == "stop_bullets"){
                io.sockets.emit('item_generator', {
                    wall: 1,
                    startingX: canvasWidth+itemRadius,
                    startingY: randomStartY,
                    destinationX: itemRadius,
                    destinationY: randomDestinationY,
                    name : name
                })
            }
            
        }
    }

    function itemUpSideGenerator(name){
        if(balls.length){
            var randomStartX = Math.floor(Math.random() * 1024)
            var randomDestinationX = Math.floor(Math.random() * 1024)
            if(name == "delete_bullets"){
                io.sockets.emit('item_generator', {
                    wall: 2,
                    startingX: randomStartX,
                    startingY: itemRadius,
                    destinationX: randomDestinationX,
                    destinationY: canvasHeight+itemRadius,
                    name : name
                })
            }
            else if(name == "stop_bullets"){
                io.sockets.emit('item_generator', {
                    wall: 2,
                    startingX: randomStartX,
                    startingY: itemRadius,
                    destinationX: randomDestinationX,
                    destinationY: canvasHeight+itemRadius,
                    name : name
                })
            }
            
        }
    }

    function itemDownSideGenerator(name){
        if(balls.length){
            var randomStartX = Math.floor(Math.random() * 1024)
            var randomDestinationX = Math.floor(Math.random() * 1024)
            if(name == "delete_bullets"){
                io.sockets.emit('item_generator', {
                    wall: 3,
                    startingX: randomStartX,
                    startingY: canvasHeight+itemRadius,
                    destinationX: randomDestinationX,
                    destinationY: itemRadius,
                    name : name
                })
            }
            else if(name == "stop_bullets"){
                io.sockets.emit('item_generator', {
                    wall: 3,
                    startingX: randomStartX,
                    startingY: canvasHeight+itemRadius,
                    destinationX: randomDestinationX,
                    destinationY: itemRadius,
                    name : name
                })
            }
            
        }
    }

    function itemGenerator(name){
        k = Math.floor(Math.random)*4
        if(k == 0){
            itemLeftSideGenerator(name);
        }
        else if(k == 1){
            itemRightSideGenerator(name);
        }
        else if(k==2){
            itemUpSideGenerator(name);
        }
        else{
            itemDownSideGenerator(name);
        }
    }
    // 각 함수에서 생성위치와 도착위치를 보내면 gamePage.js에서 받아서 아이템 생성
    
    function stageFail(){
        var isFail = true;
        for(let i = 0 ; i < balls.length ; i++){
            if(balls[i].state == 1){
                isFail = false;
            }
        }
        return isFail;
    }
    // 모두 충돌해서 state가 0일 경우 isFail = true
    // 한명이라도 살아있는 경우 isFail = false

    
    socket.on('rank_s',function(data){
        if(data.name == null){
            name.push("무명")
        }else{
            name.push(data.name);
        }
        stage.push(data.stage);
        time.push(data.time);
        for(var i = 0 ; i < name.length ; i++){
            console.log((i+1)+"번 째");
            console.log("닉네임 : "+ name[i]);
            console.log("스테이지 : "+stage[i]);
            console.log("시간 : "+time[i]);
        }
    })
    // 닉네임, 스테이지, 시간을 배열로 저장 >> 이름 입력이 안돼있을 경우 꼬임 >> '무명'을 넣어줌

    socket.emit('rank_r',{
        name:name,
        stage:stage,
        time:time
    })
    // 저장된 내용을 ranking.js로 넘김

})


