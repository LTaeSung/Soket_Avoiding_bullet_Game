// 클래스 선언 
// 플레이어 (아이디, 좌표, 색깔, 상태(live or die), 반지름, 속도)
        class PlayerBall{
            constructor(id,color,x,y){
                this.id = id;
                this.x = x;
                this.y = y;
                this.color = color;
                this.state = 1;
                this.radius = 16;
                this.playerSpeed = 4;
            }
            getId(){
                return this.id;
            }
            setId(id){
                this.id = id;
            }
            getX(){
                return this.x;
            }
            setX(x){
                this.x = x;
            }
            getY(){
                return this.y;
            }
            setY(y){
                this.y = y;
            }
            getColor(){
                return this.color;
            }
            setColor(color){
                this.color = color;
            }
            getState(){
                return this.state;
            }
            setState(state){
                this.state = state;
            }
            getRadius(){
                return this.radius;
            }
            setRadius(radius){
                this.radius = radius;
            }
            getPlayerSpeed(){
                return this.playerSpeed;
            }
            setPlayerSpeed(playerSpeed){
                this.playerSpeed = playerSpeed;
            }
        }


// 총알 (색, 현재 좌표, 목적지 좌표, 시작 좌표, 시작한 벽, 반지름, 지속시간(300), 속도(x,y 따로))
class EnemyBall{
    constructor(x,y,destinationX,destinationY, wall){

        this.color = "#000000";
        this.x = x;
        this.y = y;
        this.destinationX = destinationX;
        this.destinationY = destinationY;
        this.initialX = x;
        this.initialY = y;
        this.wall = wall;
        this.radius = 10;
        this.aliveTime = 300;
        this.speedX = 0;
        this.speedY = 0;
    }
    getSpeedX(){
        return this.speedX;
    }
    setSpeedX(speedX){
        this.speedX = speedX;
    }

    getSpeedY(){
        return this.speedY;
    }
    setSpeedY(speedY){
        this.speedY = speedY;
    }

    getColor(){
        return this.color;
    }
    setColor(color){
        this.color = color;
    }
    getX(){
        return this.x;
    }
    setX(x){
        this.x = x;
    }
    getY(){
        return this.y;
    }
    setY(y){
        this.y = y;
    }
    getDestinationX(){
        return this.destinationX;
    }
    setDestinationX(destinationX){
        this.destinationX = destinationX;
    }
    getDestinationY(){
        return this.destinationY;
    }
    setDestinationY(destinationY){
        this.destinationY = destinationY;
    }
    getInitialX(){
        return this.initialX;
    }
    setInitialX(initialX){
        this.initialX = initialX;
    }
    getInitialY(){
        return this.initialY;
    }
    setInitialY(initialY){
        this.initialY = initialY;
    }
    getWall(){
        return this.wall;
    }
    setWall(wall){
        this.wall = wall;
    }
    getRadius(){
        return this.radius;
    }
    setRadius(radius){
        this.radius = radius;
    }
    getAliveTime(){
        return this.aliveTime;
    }
    setAliveTime(aliveTime){
        this.aliveTime = aliveTime;
    }
}

// 일렬패턴 총알 (색, 현재 좌표, 목적지 좌표, 시작 좌표, 시작한 벽, 반지름, 지속시간(300))
// 일렬패턴은 아이템을 먹어도 정지하지 않으므로 속도설정을 따로 할 일이 없어서 속도 부분이 빠진 듯
class straightEnemyBall{
    constructor(x,y,destinationX,destinationY, wall){

        this.color = "#000000";
        this.x = x;
        this.y = y;
        this.destinationX = destinationX;
        this.destinationY = destinationY;
        this.initialX = x;
        this.initialY = y;
        this.wall = wall;
        this.radius = 10;
        this.aliveTime = 300;
    }
    getColor(){
        return this.color;
    }
    setColor(color){
        this.color = color;
    }
    getX(){
        return this.x;
    }
    setX(x){
        this.x = x;
    }
    getY(){
        return this.y;
    }
    setY(y){
        this.y = y;
    }
    getDestinationX(){
        return this.destinationX;
    }
    setDestinationX(destinationX){
        this.destinationX = destinationX;
    }
    getDestinationY(){
        return this.destinationY;
    }
    setDestinationY(destinationY){
        this.destinationY = destinationY;
    }
    getInitialX(){
        return this.initialX;
    }
    setInitialX(initialX){
        this.initialX = initialX;
    }
    getInitialY(){
        return this.initialY;
    }
    setInitialY(initialY){
        this.initialY = initialY;
    }
    getWall(){
        return this.wall;
    }
    setWall(wall){
        this.wall = wall;
    }
    getRadius(){
        return this.radius;
    }
    setRadius(radius){
        this.radius = radius;
    }
    getAliveTime(){
        return this.aliveTime;
    }
    setAliveTime(aliveTime){
        this.aliveTime = aliveTime;
    }
}

// 아이템 (색(아이템 종류에 따라 바뀜), 현재 좌표, 목적지 좌표, 시작 좌표, 시작한 벽, 반지름, 지속시간(1000), 아이템 이름)
class itemBall{
    constructor(x,y,destinationX,destinationY, wall, name){

        this.color = "#6f4e37";
        this.x = x;
        this.y = y;
        this.destinationX = destinationX;
        this.destinationY = destinationY;
        this.initialX = x;
        this.initialY = y;
        this.wall = wall;
        this.radius = 20;
        this.aliveTime = 1000;
        this.name = name;
    }
    getName(){
        return this.name;
    }
    setName(name){
        this.name = name;
    }
    getColor(name){
        if(name == "delete_bullets"){
            return this.color;
        }
        else if(name == "stop_bullets"){
            return "#0067a3";
        }
        
    }
    setColor(color){
        this.color = color;
    }
    getX(){
        return this.x;
    }
    setX(x){
        this.x = x;
    }
    getY(){
        return this.y;
    }
    setY(y){
        this.y = y;
    }
    getDestinationX(){
        return this.destinationX;
    }
    setDestinationX(destinationX){
        this.destinationX = destinationX;
    }
    getDestinationY(){
        return this.destinationY;
    }
    setDestinationY(destinationY){
        this.destinationY = destinationY;
    }
    getInitialX(){
        return this.initialX;
    }
    setInitialX(initialX){
        this.initialX = initialX;
    }
    getInitialY(){
        return this.initialY;
    }
    setInitialY(initialY){
        this.initialY = initialY;
    }
    getWall(){
        return this.wall;
    }
    setWall(wall){
        this.wall = wall;
    }
    getRadius(){
        return this.radius;
    }
    setRadius(radius){
        this.radius = radius;
    }
    getAliveTime(){
        return this.aliveTime;
    }
    setAliveTime(aliveTime){
        this.aliveTime = aliveTime;
    }
}
