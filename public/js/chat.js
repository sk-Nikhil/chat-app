const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')                 //getting form
const $messageFormInput = document.querySelector('input')           
const $messageFormButton = document.querySelector('#formButton')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Templates
const messageTemplate = (message)=>{
    return (`
    <div id = 'message-template' class='message'>
    <p>
        <span class = "message__name">${message.username}</span>
        <span class = "message__meta">${moment(message.createdAt).format('h:mm A')} </span>
    </p>   
    <p>${message.text}</p>
    </div>
    `)
}

const locationTemplate =(location)=>{
    return (
    `
    <div id = 'location-template'>
    <p>
        <span class = "message__name">${location.username}</span>
        <span class = "message__meta">${moment(location.createdAt).format('h:mm A')} </span>
    </p>    
    <p><a href = ${location.url} target='_blank'>My Location</a></p>
    </div>`)
} 


// Options
const {username, room} = Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll = () => {
    // new messsage element
    const $newMessage = $messages.lastElementChild
    
    // height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    
    // visible height
    const visibleHeight = $messages.offsetHeight

    // height of message container
    const containerHeight = $messages.scrollHeight

    // how far i have scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }   
}

// Message Template render
socket.on('message', (message)=>{
    // message is an object
    // const html = Mustache.render(messageTemplate,{message})
    $messages.insertAdjacentHTML('beforeend', messageTemplate(message))
    autoscroll()
})

// location Template render
socket.on('locationMessage', (location) => {
    // rendering template
    // const html = Mustache.render(locationTemplate,{url})
    $messages.insertAdjacentHTML('beforeend', locationTemplate(location))
    autoscroll()
})


socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


// sending messages
$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()

    // disable button
    
    // getting input value
    const message = e.target.elements.message.value
    if(!message){
        return
    }
    
    $messageFormButton.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage',message,(error)=>{

        // enable and focus button
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error) {         //check for if it contains message
            return console.log(error)
        }

        console.log("message delivered")
    })
})


document.querySelector('#send-location').addEventListener('click', ()=>{
    if(!navigator.geolocation) {
        return alert('geolocation is not support by your browser')
    }
    // disable button
    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position)=>{

        // getting location lat and long
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        
        // emitting lat and long
        socket.emit('sendLocation', {latitude, longitude}, ()=>{
            // enable button
            $sendLocationButton.removeAttribute('disabled')

            console.log("Location Shared ")
        })
    })
})


socket.emit('join',{username, room},(error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }

})