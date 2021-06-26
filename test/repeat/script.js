var data = juice.data({
    repeats: 1,
});
window.setInterval(()=>data.repeats = data.repeats >= 5 ? 1 : data.repeats+1, 500);

juice.def()
    .color('grey')
    .def('shape')
        .color('black')
        .padgap('1u')
        .wrap()
        .center()
        .repeat(data.repeats)
            .def('shape')
                .width('2u')
                .height('2u')
                .color('red')
            .end()
        .end()
    .end()
.end();
