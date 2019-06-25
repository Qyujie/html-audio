$('#submit').click(function() {
    var name = $('#name').val();
    var password = $('#password').val();
    var page = "http://119.23.50.158:3000/login/cellphone";
    $.ajax({
        type: "post",
        url: page,
        data: {
            "phone": name,
            "password": password
        },
        success: function(response) {
            console.log(response);
            window.location.href = "audio.html";

        },
    });
});