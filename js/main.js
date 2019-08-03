console.log('asd');
var name = $('#name').val();
var password = $('#password').val();
var page = "/login/cellphone";

$('#submit').click(function() {
    $.ajax({
        type: "get",
        url: page,
        data: {
            "phone": name,
            "password": password
        },
        dataType: 'JSONP', // 处理Ajax跨域问题
        success: function(response) {
            console.log(response);
        }
    });
});