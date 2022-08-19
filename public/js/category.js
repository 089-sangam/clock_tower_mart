function showForm(){
    var category = document.getElementById("category").value;
    var cycle = document.getElementById("cycle");
    var mattress = document.getElementById("mattress");
    var books = document.getElementById("books");
    if(category == "cycle")
    {
        cycle.style.display = 'block';
        mattress.style.display = 'none';
        books.style.display = 'none';
    }   
    else if(category == "mattress")
    {
        mattress.style.display = "block";
        cycle.style.display = "none";
        books.style.display = "none";
    }
    else if(category == "books")
    {
        books.style.display = "block";
        cycle.style.display = "none";
        mattress.style.display = "none";
    }
    else if(category == "electrical")
    {
        cycle.style.display = "none";
        mattress.style.display = "none";
        books.style.display = "none";
    }
    else
    {
        cycle.style.display = "none";
        mattress.style.display = "none";
        books.style.display = "none";
        
    }
}