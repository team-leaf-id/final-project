$(document).ready(function() {
  $('.top-bar').click(function() {
    $('.search-box').toggle('blind', { direction: 'vertical' }, 'fast');
  });
  $('.top-bar').click(function() {
    $('#logo').toggle(1, 'linear');
  });


  
  $("#firstWord").firstWord();
});
