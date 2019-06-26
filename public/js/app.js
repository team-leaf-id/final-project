$(document).ready(function() {
  $(".top-bar").click(function() {
    $(".search-box").toggle("blind", { direction: "vertical" }, "fast");
  });
  $(".top-bar").click(function() {
    $("#logo").toggle(1, "linear");
  });

  // $(".fish-pic").hover(
  //   function() {
  //     $(".fish-pic").addClass("hoverTransition");
  //   },
  //   function() {
  //     $(".fish-pic").removeClass("hoverTransition");
  //   }
  // );
});
