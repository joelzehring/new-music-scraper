$(document).ready(function() {
  $(".change-saved").on("click", function(event) {
    console.log("Article: " + $(this).data("id") + " Saved status: " + $(this).data("newsaved"));
    var id = $(this).data("id");
    var newSaved = $(this).data("newsaved");

    var newSavedState = {
      saved: !newSaved
    };

    // Send the PUT request.
    $.ajax("/savestatus/" + id, {
      type: "POST",
      data: newSavedState
    }).then(
      function() {
        //console.log("changed saved to" + newSaved);
        // Reload the page to get the updated list
        location.reload();
      }
    );
  });
});