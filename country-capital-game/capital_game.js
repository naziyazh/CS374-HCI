// This allows the Javascript code inside this block to only run when the page
// has finished loading in the browser.

$( document ).ready(function() {
    var firebaseConfig = {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
        measurementId: ""
      };
      // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    function writeToDatabase(country, user_answer, answer){
        var newKey = firebase.database().ref('/entries').push();
        newKey.set({
           country: country,
           user_answer: user_answer,
           answer: answer
        });
    }
    function checkUndoButton(){
        var undoRef = firebase.database().ref('/undo/');
        undoRef.once('value', function(snapshot){
            var myValue = snapshot.val();
            var keyList = Object.keys(myValue);
            if (keyList.length === 1){
                $('#pr3__undo').prop('disabled', true);
            }else{
                $('#pr3__undo').prop('disabled', false);
            }
        });
    }


    function undo(){
        var undoRef = firebase.database().ref('/undo/');
        undoRef.once('value', function(snapshot){
            var myValue = snapshot.val();
            var keyList = Object.keys(myValue);
            var undoKey = keyList[keyList.length-1];
            console.log(undoKey);
            firebase.database().ref('/entries/').once('value', function(snapshot) {
                var myVal = snapshot.val();
                var key_list = Object.keys(myVal);
                if (myValue[undoKey].action === "add"){
                    var entry_key = key_list[-1];
                    firebase.database().ref('/entries/' + entry_key).remove(); 
                    $('tbody').children().last().remove();
                    checkEmptyTable($('input[type="radio"]:checked').val());
                }else if (myValue[undoKey].action === "delete"){
                    for (i = 1; i < key_list.length; i++){
                        if (myVal[key_list[i]].answer === myValue[undoKey].target){
                            break;
                        }       
                    }
                    addRow(myVal[key_list[i]].country,myVal[key_list[i]].user_answer,myVal[key_list[i]].answer,i);
                }else{
                    for (j = key_list.length - myValue[undoKey].target; j < key_list.length; j++){
                        addRow(myVal[key_list[j]].country,myVal[key_list[j]].user_answer,myVal[key_list[j]].answer,-1);
                    }
                }
            }); 
            firebase.database().ref('/undo/' + undoKey).remove(); 
            checkUndoButton();
        });
    }

    function addActionToDatabase(action, target){
        var newKey = firebase.database().ref('/undo/').push();
        newKey.set({
           action: action,
           target: target
        });
        checkUndoButton();
    }

    function readfromDatabase(){
        return firebase.database().ref('/entries/').once('value', function(snapshot) {
            var myValue = snapshot.val();
            var keyList = Object.keys(myValue);
            if (keyList.length > 1){
                for(var i=1; i<keyList.length; i++){
                    var myKey = keyList[i];
                    addRow(myValue[myKey].country, myValue[myKey].user_answer, myValue[myKey].answer, -1);
                }
            }
        });
    }
    function addRow(country, user_answer, answer, position){
        var new_row = document.createElement("tr");
        
        var columns = new Array(3);
        var class_name;
        for (i = 0; i < 3 ; i++){
            columns[i] = document.createElement("th")
        } 
        if (answer.trim().toUpperCase() !== user_answer.trim().toUpperCase()){
            class_name = 'incorrect';
            $(columns[1]).css('text-decoration', 'line-through');
        }else{
            class_name = 'correct';
        }
        columns[0].textContent = country;
        columns[1].textContent = user_answer;
        columns[2].textContent = answer;

        $(columns[0]).on('mouseenter',function(){
            $('iframe').css('border', '3px solid orange');
            update_map($(this).text());
        } ).mouseleave(function(){
            $('iframe').css('border', '');
        });
        
        $(columns[2]).mouseenter(function(){
            $('iframe').css('border', '3px solid black');
            $('iframe').prop('zoom', '4');
            $('iframe').css('filter', 'grayscale()');
            update_map($(this).text().replace('Delete', ''));
        } ).mouseleave(function(){
            $('iframe').prop('zoom', '');
            $('iframe').css('border', '');
            $('iframe').css('filter', 'none');
        });

        columns[2].appendChild(add_delete_btn());

        for (i = 0; i < 3 ; i++){
            new_row.appendChild(columns[i]);
        }
        new_row.className = class_name;
        if (position === -1){
            $('tbody').append(new_row);
        }else{
            document.querySelector('tbody').insertBefore(new_row,document.querySelector('tbody').children[4 + position]); 
        }
        checkEmptyTable($('input[type="radio"]:checked').val());
        
        return new_row;       
            
    } 
 
    function entry_generator(country_capital_pairs){
        var len = country_capital_pairs.length;
        var element_index = Math.floor(Math.random() * len);
        var element = country_capital_pairs[element_index];
        document.querySelector("#pr2__question").textContent = element['country'];
        update_map(element['country']);
        return element["capital"];
    }

    function update_map(place){
        var link = src="https://www.google.com/maps/embed/v1/search?key=APIKEY&language=en&q=";
        link += place;
        $('iframe').attr('src', link);
    }

    function checkEmptyTable(mode){
        var class_name = "." + mode;
        if (document.querySelector('tbody').childElementCount === 5){
            $('#empty-row').css("display", "table-row");
            $('#pr3__clear').prop('disabled',true);
        }else{
            if ((mode !== "all") && document.querySelectorAll(class_name).length === 0){
                $('#empty-row').css("display", "table-row");
                $('#pr3__clear').prop('disabled',true);
            }else if (mode === "all"){
                $('#empty-row').css("display", "none");
                $('#pr3__clear').prop('disabled',false);
                
            }else{
                $('#empty-row').css("display", "none");
                $('#pr3__clear').prop('disabled',false);
            }
        }
    }
    function filterList(class_entry){
        if (class_entry === "all"){
            $('.correct').css('display', 'table-row');
            $('.incorrect').css('display', 'table-row');
        }else if(class_entry === "correct"){
            $('.incorrect').css('display', 'none');
            $('.correct').css('display', 'table-row');
        }else{
            $('.correct').css('display', 'none');
            $('.incorrect').css('display', 'table-row');
        }
        checkEmptyTable(class_entry);
        
    }
    function add_delete_btn(){
        var delete_button = document.createElement("button");
        delete_button.innerHTML = "Delete";
        delete_button.className = "delete_btn";
        delete_button.addEventListener('click', (event)=>{
            var text = event.target.parentNode.textContent;
           addActionToDatabase("delete", text.replace('Delete',''));
           document.querySelector('tbody').removeChild(event.target.parentNode.parentNode);
           checkEmptyTable($('input[type="radio"]:checked').val());
           $('iframe').css('filter','none');
         });
        return delete_button;
    }
    function check_answer(answer){
        var user_answer = document.querySelector("#pr2__answer").value;
        var radioVal = $('input[type="radio"]:checked').val();
        var country = $('#pr2__question').text();
        document.querySelector('form').reset();
        writeToDatabase(country, user_answer, answer);
        var new_row = addRow(country, user_answer, answer, -1);
        addActionToDatabase("add", 0);
        if ((new_row.className === "correct" && radioVal === "incorrect") || (new_row.className === "incorrect" && radioVal === "correct")){
            $('#all').trigger("click");
         }
        checkEmptyTable($('input[type="radio"]:checked').val());
    }
    function createEmptyRow(){
        var empty_row = document.createElement("tr");
        empty_row.appendChild(document.createElement("th"));
        empty_row.appendChild(document.createElement("th").appendChild(document.createTextNode("No entry to show")));
        empty_row.appendChild(document.createElement("th"));
        empty_row.id = "empty-row";
        document.querySelector('tbody').appendChild(empty_row);
    };
    function clearTable(x){
        var cleared = 0;
        while (document.querySelector('tbody').childElementCount !== 5){
            var child = document.querySelector('tbody').lastElementChild;
            document.querySelector('tbody').removeChild(child);
            cleared++;
            i--;
        }
        if (x){
            addActionToDatabase("clear",cleared);
        }
    }
    function restart(){
        var entryRef = firebase.database().ref('/entries/');
        var undoRef = firebase.database().ref('/undo/')
        entryRef.once('value', function(snapshot){
            var myValue1 = snapshot.val();
            var keyList1 = Object.keys(myValue1);
            if (keyList1.length > 1){
                for(var i = 1; i < keyList1.length; i++){
                    var myKey1 = keyList1[i];
                    firebase.database().ref('/entries/' + myKey1).remove();
                }
            }
        });
        undoRef.once('value', function(snapshot){
            var myValue2 = snapshot.val();
            var keyList2 = Object.keys(myValue2);
            if (keyList2.length > 1){
                for(var i = 1; i < keyList2.length; i++){
                    var myKey2 = keyList2[i];
                    firebase.database().ref('/undo/' + myKey2).remove();
                }
            }
        });
        checkUndoButton();
        $('#all').trigger("click");
        clearTable(false);
        checkEmptyTable("all");
        return entry_generator(window.pairs);
    }


     //fetching the data
     window.pairs = new Array();
     let myRequest = new Request('http://cs374.s3.ap-northeast-2.amazonaws.com/country_capital_pairs.csv');
     const fetchResponseFile = fetch(myRequest)
      .then(response => response.text())
      .then(data => data.split("\n"))
      .then(lines => lines.map(line => line.split(",")))
      .then(new_lines =>{
          for (i=0; i< new_lines.length; i++){
                 var obj = {};
                 if (new_lines[i][0] != "country"){
                      obj["country"] = new_lines[i][0];
                      obj["capital"] = new_lines[i][1];
                      window.pairs.push(obj);
                  }
         }
          return window.pairs; 
    });

    $('input[type="radio"]').click(function(){
            var class_entry = $(this).val();
            console.log(class_entry);
            filterList(class_entry);
          });
          
    $('#pr3__clear').click(function(){
        clearTable(true);
        checkEmptyTable($('input[type="radio"]:checked').val());
    });

    $('#pr2__question').mouseenter(function(){
        $('iframe').css('border', '3px solid orange');
        update_map($('#pr2__question').text());
    } ).mouseleave(function(){
        $('iframe').css('border', '');
    });

    

    setTimeout(function(){
        checkUndoButton(); 
        createEmptyRow();
        readfromDatabase();
        checkEmptyTable("all");
        document.getElementById("pr2__answer").focus(); 
        let capitals = window.pairs.map(entry => entry.capital);
        var answer = entry_generator(window.pairs); 
        $("#pr2__submit").on("click", ()=>{
            check_answer(answer);
            answer = entry_generator(window.pairs); 
            document.getElementById("pr2__answer").focus();
            
         });

        $('#pr3__restart').click(()=>{
            answer = restart(); 
        })

         $("#pr2__answer").keypress(function(event) {
            // Number 13 is the "Enter" key on the keyboard
            
            if (event.keyCode === 13) {
              
              // Trigger the button element with a click
              $("#pr2__submit").trigger("click");
              event.stopImmediatePropagation();
            }
          });

         $( "#pr2__answer" ).autocomplete({
            source: capitals,
            minLength: 2
         }).keydown(function(event){
          if (event.keyCode === 13) {
            event.preventDefault();
            event.stopImmediatePropagation();
            $("#pr2__submit").trigger('click');
          }
        });
        
          $('.ui-autocomplete').on("click",function(event){
            $("#pr2__submit").trigger("click");
          });

           $('#pr3__undo').click(function(){
               undo();
           })

                
        
}, 100);  
   
    
});
