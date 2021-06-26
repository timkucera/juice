var styles = juice.data({
    style: ['border','shadow','round colorfill','colorfill','border colorcontour', 'dark', 'dark colorcontour border', 'rounded neumorph-up', 'rounded neumorph-down', 'glass'],
    theme: (i,v)=>{return Object({style: v.style})},
});

// juice.setTheme({
//     color: {primary:'orange'},
// });

juice.template('card')
    .def('shape')
        .padgap('5px').width('5u').height('7u').flow('td').align('center').space('center').style().theme($template).color('blue')
        .def('shape')
            .width('1u').height('1u').color('orange').style('colorfill')
        .end()
        .def('text')
            .text($template.style).align('center')
        .end()
        .def()
            .flow('lr').width('100%').space('evenly').css('overflow:visible')
            .def('button')
                .width('2u').height('1u').color('orange').bold().text('Button').style()
            .end()
            .def('button')
                .width('2u').height('1u').color('green').bold().text('Button').style()
            .end()
        .end()
    .end()
.end();

juice.def()
    .style('light')
    //.css('background-color: #ddd;background-image:repeating-linear-gradient(120deg, rgba(255,255,255,.1), rgba(255,255,255,.1) 1px, transparent 1px, transparent 60px),repeating-linear-gradient(60deg, rgba(255,255,255,.1), rgba(255,255,255,.1) 1px, transparent 1px, transparent 60px),linear-gradient(60deg, rgba(0,0,0,.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,.1) 75%, rgba(0,0,0,.1)),linear-gradient(120deg, rgba(0,0,0,.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,.1) 75%, rgba(0,0,0,.1));background-size: 70px 120px;')
    .def('shape')
        .padgap('1u').wrap().space('around').center()
        .map(styles)
            .card(styles.theme)
        .end()
    .end()
.end();
