
var ui = new juice.UI()
    .media(view => view.isPortrait(), 'portrait')
    .media(view => view.isLandscape(), 'landscape')
    .media(view => view.isMobile(), 'mobile')
    .media(view => view.width < 300 && view.height < 300, 'small')
;
///////////////
// LANDSCAPE //
///////////////

var layout_landscape = ui.layout('landscape')
    .gridsize(30)
    .flow('leftright')
;

layout_landscape.define('map')
    .width('fill')
    .height('100%')
    .pad('10px')
;

layout_landscape.define('menu')
    .width('10u')
    .height('100%')
    .flow('topdown')
    .gap('10px')
;

layout_landscape.menu.define('playlist')
    .width('100%')
    .height('4u')
    .color('brown')
    .type('shape')
    .padgap('10px')
    .style('flat rounded')

;

layout_landscape.menu.playlist.define('slider_value')
    .height('1u')
    .type('text')
    .text('10')
    .fontsize('18px')
    .bold()
    .color('parent')
    .center()
;

layout_landscape.menu.playlist.define('slider')
    .width('100%')
    .height('1u')
    .color('parent')
    .type('slider')
    .min(0)
    .max(50)
    .default(10)
    .style('round border')
;

var buttons = layout_landscape.menu.playlist.define('buttons')
    .width('100%')
    .height('2u')
    .flow('leftright')
    .color('parent')
    .spaceItems()
    .define('save')
        .width('/3-2*5px')
        .height('1u')
        .color('parent')
        .type('button')
        .text('Save')
        .style('flat round')
    .parent().define('load')
        .width('/3-2*5px')
        .height('1u')
        .color('parent')
        .type('button')
        .text('Load')
        .style('flat round')
    .parent().define('delete')
        .width('/3-2*5px')
        .height('1u')
        .color('parent')
        .type('button')
        .text('Delete')
        .style('flat round')
;

layout_landscape.menu.define('player')
    .width('100%')
    .height('50%')
    .color('white')
    .type('shape')
    .style('border rounded')
    .padgap('10px')
    .spaceItems()
;

layout_landscape.menu.player.define('cover')
    .width('200px')
    .height('200px')
    .hcenter()
    .color('black')
    .type('image')
    .source('src/cover.jpg')
    .style('flat round')
;

layout_landscape.menu.player.define('progress')
    .width('90%')
    .hcenter()
    .height('5px')
    .color('black')
    .type('progress')
    .default(30)
    .style('round')
;

var controls = layout_landscape.menu.player.define('control')
    .width('100%')
    .height('1u')
    .type('shape')
    .style('flat round')
    .flow('lr')
    .spaceItems()
    .define('previous')
        .width('1u')
        .height('1u')
        .type('button')
        .image('src/prev.png')
    .parent().define('playstop')
        .width('1u')
        .height('1u')
        .type('button')
        .image('src/play.png')
    .parent().define('next')
        .width('1u')
        .height('1u')
        .type('button')
        .image('src/next.png')
;

//////////////
// PORTRAIT //
//////////////
/*
var layout_portrait = ui.layout(copyFrom='landscape')
    .media('portrait')
    .gridsize(30)
    .flow('top left')
;
*/
