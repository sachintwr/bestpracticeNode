// socketConfig.js
import socketIo from 'socket.io';

let users = [];

function storeUsers(userData) {
    let restUsers = users.filter((user) => user.email !== userData.email);
    restUsers.push(userData);
    users = restUsers;
}

function removeUsers(socketId) {
    users = users.filter((user) => user.socketId !== socketId);
}

function initializeSocket(http_server, https_server, allowedOrigins, environment) {
    const io = environment === 'production' ?
        socketIo(https_server, {
            cors: {
                origin: allowedOrigins,
                methods: ["GET", "POST", "PUT", "DELETE"]
            }
        }) :
        socketIo(http_server, {
            cors: {
                origin: allowedOrigins,
                methods: ["GET", "POST", "PUT", "DELETE"]
            }
        });

    io.on("connection", (socket) => {
        socket.emit("storeUser", socket.id);

        socket.on("onlineUsers", (data) => {
            socket.emit("onlineUsersAreHere", users);
        });

        socket.on("storeMe", (arg) => {
            console.log(`${arg} connected with: ${socket.id}`);
            storeUsers({ socketId: socket.id, email: arg });
            io.sockets.emit("onlineUsersAreHere", users);
        });

        socket.on("wobbleIndividual", (data) => {
            const usersSocket = users.find(user => user.email === data.toEmail);
            if (usersSocket) {
                socket.to(usersSocket.socketId).emit("wobbleTriggered", { "name": data.fromName, "email": data.fromEmail });
            }
        });

        socket.on("sendMessageIndividual", (message) => {
            const usersSocket = users.find(user => user.email === message.toEmail);
            if (usersSocket) {
                socket.to(usersSocket.socketId).emit("messageArrived", message);
            }
        });

        socket.on("disconnect", () => {
            console.log("disconnected: " + socket.id);
            removeUsers(socket.id);
            io.sockets.emit("onlineUsersAreHere", users);
        });
    });

    return io;
}

export default initializeSocket;
