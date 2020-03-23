layui.use(['form', 'layer'], function () {
    var form = layui.form
        , layer = layui.layer,
        curPage = ""
    var socket = io();
    socket.on('connect', function () {
        console.log("socket connect");
    });
    socket.on('disconnect', () => {
        console.log("socket disconnect");
        // socket.open();
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
    // 监听消息返回
    socket.on('oldChat', function (data) {
        $("#chatList").html("");
        chatListRend(data.data)
    })
    socket.on('chatLists', function (data) {
        if (data.code == 0) {
            chatListRend(data.data)
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
    // 渲染消息
    function chatListRend(data) {
        var str = "";
        for (var i = 0; i < data.length; i++) {
            var name = data[i].userName;
            str +=
                '<div class="chatItem' + (name == user ? " self" : "") + '" style="padding: 10px;" data-id="single003">' +
                '<div class="author">' + (name == user ? "我" : name.slice(0, 2)) + '</div>' +
                '<div class="time"><span style="font-weight:bold" class="name">' + (name == user ? "" : name) + ' </span>' +
                '<span>' + (data[i].userChatTime ? data[i].userChatTime : "") + '</span></div>' +
                '<div class="massage">' + data[i].userChat + '</div>' +
                '</div>'
        }
        $("#chatList").append(str);
        $("#chatRoom").scrollTop($("#chatRoom")[0].scrollHeight - $("#chatRoom")[0].offsetHeight);
    }
    // 聊天列表点击事件
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
        layer.close(curPage);
    })
    // 发送事件
    $("#send-btn").on("click", function () {
        var msg = $("#chatWord").val();
        if (msg.trim() != "") {
            var sendData = {
                msg: msg,
                userName: user,
                toWho: $("#roomName").text(),
                roomId: $("#roomName").attr("data-id"),
            }
            socket.emit('sendMsg', sendData);
            $("#chatWord").val("")
        }
    })
    // 点击他人聊天
    $("#chatList").on("click", ".author", function (e) {
        if ($(e.currentTarget).parent().hasClass("self")) {
            return false;
        } else {
            // layer.confirm('确定要离开当前页面嘛?', function (index) {
            layer.close(curPage);
            var roomId = $(e.currentTarget).parent().attr("data-id");
            var title = $(e.currentTarget).next().find(".name").text();
            openNewPage(roomId, title)
            // });
        }
    })
    socket.on('openNewPage', function (data) {
        openNewPage(data.roomId, data.roomName)
    });
    function openNewPage(roomId, roomName) {
        layer.open({
            type: 1,
            // title: title,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
            title: false,
            closeBtn: 0,
            area: ['375px', '667px'],
            content: $("#chatRoom"),
            success: function (layero, index) {
                curPage = index;
                $("#roomName").text(roomName);
                $("#roomName").attr("data-id", roomId);

                socket.emit('join', { roomId: roomId, user: user }, function (num) {
                    $("#userCount").text(" (" + num + ")")
                });
            }
        });
    }
    function getQuery(name) {
        var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
        var r = window.location.search.substr(1).match(reg);
        if (r != null) {
            return unescape(r[2]);
        }
        return null;
    }
})