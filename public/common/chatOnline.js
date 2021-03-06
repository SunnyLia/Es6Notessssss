layui.use(['form', 'layer'], function () {
    var layer = layui.layer;
    var socket = io();
    socket.on('connect', function () {
        console.log("socket connect");
    });
    socket.on('disconnect', () => {
        console.log("socket disconnect");
    });
    var user = window.sessionStorage.getItem("user");
    // 刷新页面登陆
    if (user) {
        socket.emit('login', { user: user });
    }
    // input回车发送
    $("#chatWord").keypress(function (e) {
        if (e.which == 13) {
            $("#send-btn").click();
        }
    });
    // 监听旧消息
    socket.on('oldChat', function (data) {
        // $("#chatList").html("");
        chatListRend(data.data)
    })
    // 新消息监测
    socket.on('chatLists', function (data) {
        if (data.code == 0) {
            chatListRend(data.data)
        } else if (data.code == 2) {
            layer.msg(data.msg)
        } else {
            layer.msg(data.msg.name)
        }
    });
    // 进入退出监测
    socket.on('inORout', function (data) {
        var str = '<div id="inORout"><span>' + data.msg + '</span></div>';
        $("#chatList").append(str);
        $("#userCount").text("(" + data.count + ")")
        $("#chatRoom").scrollTop($("#chatRoom")[0].scrollHeight - $("#chatRoom")[0].offsetHeight);
    });
    // 聊天列表点击聊天事件
    $("#chatLists").on("click", ".chatItem", function (e) {
        var roomId = $(e.currentTarget).attr("data-id");
        var title = $(e.currentTarget).find(".chatTitle").text();
        if (!user) {
            layer.prompt({ title: '请先创建聊天身份', formType: 3 }, function (pass, index) {
                user = pass;
                window.sessionStorage.setItem("user", pass);
                socket.emit('login', { user: user });
                layer.close(index)
                openNewPage(roomId, title);
            });
        } else {
            openNewPage(roomId, title);
        }
    })
    // 弹框关闭事件
    $(".layui-icon-close").on("click", function () {
        socket.emit('inORout', user);
        layer.closeAll();
    })
    // 发送消息事件
    $("#send-btn").on("click", function () {
        var msg = $("#chatWord").val();
        if (msg.trim() != "") {
            var sendData = {
                msg: msg,
                userName: user,
                toWho: $("#roomName").text(),
                roomId: $("#roomName").attr("data-id"),
                userId: ($(".self").length > 0 ? $(".self").eq(0).attr("data-id") : null)
            }
            socket.emit('sendMsg', sendData);
            $("#chatWord").val("")
        }
    })
    // 点击列表跟他人聊天
    $("#chatList").on("click", ".author", function (e) {
        if ($(e.currentTarget).parent().hasClass("self")) {
            return false;
        } else {
            layer.confirm('确定要离开当前页面嘛?', function (index) {
                layer.closeAll();
                socket.emit('inORout', user);
                var roomId = $(e.currentTarget).parent().attr("data-id");
                var title = $(e.currentTarget).next().find(".name").text();
                openNewPage(roomId, title)
            });
        }
    })
    //有其他的消息弹框提醒
    socket.on('openNewPage', function (data) {
        layer.confirm('有来自' + data.roomName + '的新消息~', function (index) {
            layer.closeAll();
            socket.emit('inORout', user);
            openNewPage(data.roomId, data.roomName);
            chatListRend(data.msg)
        });
    });
    // 渲染新消息
    function chatListRend(data) {
        var str = "";
        for (var i = 0; i < data.length; i++) {
            var name = data[i].userName;
            str +=
                '<div class="chatItem' + (name == user ? " self" : "") + '" style="padding: 10px;" data-id="' + data[i].userId + '">' +
                '<div class="author">' + (name == user ? "我" : name.slice(0, 2)) + '</div>' +
                '<div class="time"><span style="font-weight:bold" class="name">' + (name == user ? "" : name) + '</span>' +
                '<span> ' + (data[i].userChatTime ? data[i].userChatTime : "") + '</span></div>' +
                '<div class="massage">' + data[i].userChat + '</div>' +
                '</div>'
        }
        $("#chatList").append(str);
        $("#chatRoom").scrollTop($("#chatRoom")[0].scrollHeight - $("#chatRoom")[0].offsetHeight);
    }
    // 打开弹框
    function openNewPage(roomId, roomName) {
        $("#userCount").text("");
        $("#chatList").html("");
        layer.open({
            type: 1,
            isOutAnim: false, //这个一定要加上，不然出bug，因为关闭动画有延迟，会影响下一个弹框                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
            title: false,
            closeBtn: 0,
            area: ['375px', '667px'],
            content: $("#chatRoom"),
            success: function (layero, index) {
                $("#roomName").text(roomName);
                $("#roomName").attr("data-id", roomId);
                socket.emit('join', { roomId: roomId, user: user }, function (num) {
                    $("#userCount").text(" (" + num + ")")
                });
            }
        });
    }
})