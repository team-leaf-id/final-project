$(document).ready(function() {
  $('.top-bar').click(function() {
    $('.search-box').toggle('blind', { direction: 'vertical' }, 'fast');
  });
  $('.top-bar').click(function() {
    $('#logo').toggle(1, 'linear');
  });

  $('.logo-box').click(function() {
    $('.search-box').toggle('blind', { direction: 'vertical' }, 'fast');
  });
  $('.logo-box').click(function() {
    $('#logo').toggle(1, 'linear');
  });

  $('.set > a').on('click', function() {
    if ($(this).hasClass('active')) {
      $(this).removeClass('active');
      $(this)
        .siblings('.content')
        .slideUp(200);
    } else {
      $('.set > a').removeClass('active');
      $(this).addClass('active');
      $('.content').slideUp(200);
      $(this)
        .siblings('.content')
        .slideDown(200);
    }
  });
});
