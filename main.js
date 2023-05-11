let APP_ID = "88259f29840643ad8f4f4bbc29abd87a";

let token = null;
let uid = String(Math.floor(Math.random()*100000))

let client ;
let channel ;

let localStream; 
let remoteStream;
let peerConnection; 

const servers = {
    iceServers:[
        {
            urls:['stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']
        }
    ]
}

let init = async()=>{
    client = await AgoraRTM.createInstance(APP_ID)
    await client.login({uid,token})

    //index.html?room = 223232
    channel = client.createChannel('main')
    await channel.join()
    channel.on('MemberJoined', handleUserJoined)
    client.on('MessageFromPeer',handleMessageFromPeer)
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
    document.getElementById('user-1').srcObject = localStream
}

let handleMessageFromPeer = async(message,MemberId)=>{
    message = JSON.parse(message.text)
    if (message.type === 'offer'){
        createAnswser(MemberId, message.offer)
    }

    if (message.type === 'answer'){
        addAnswer(message.answer)
    }

    if (message.type === 'candidate'){
        if (peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        }
    }
    console.log('Message:',message)
}



let handleUserJoined = async(MemberId)=>{
    console.log('A new user joined the channel:',MemberId)
    createOffer(MemberId)
}




let createOffer = async(MemberId) =>{
    await createPeerConnection(MemberId)
    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    console.log("offer:", offer)
    client.sendMessageToPeer({text:JSON.stringify({'type':'offer', 'offer':offer})}, MemberId)
}

let createPeerConnection = async(MemberId)=>{
    peerConnection = new RTCPeerConnection(servers)
    
    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream

    localStream.getTracks().forEach((track)=>{
        peerConnection.addTrack(track,localStream)
    }) 

    peerConnection.ontrack = (event)=>{ 
        event.streams[0].getTracks().forEach((track)=>{
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async(event)=>{
        if (event.candidate){
            console.log({text:JSON.stringify({'type':'candidate', 'candidate':event.candidate})},MemberId)
        }
    }
}

let createAnswser = async(MemberId,offer) =>{
    await createPeerConnection(MemberId)
    await peerConnection.setRemoteDescription(offer)
    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    client.sendMessageToPeer({text:JSON.stringify({'type':'answer','answer':answer})},MemberId)
}

let addAnswer = async(answer)=>{
    if (!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
}
init()