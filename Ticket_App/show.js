window.addEventListener('DOMContentLoaded', () =>{
  const params = new URLSearchParams(window.location.search);
  const index = params.get('id') - 120 - 1;
  const ticket = tickets[index];
  document.getElementById('ticket-id').innerHTML = ticket.ticket_no;
  document.getElementById('priority').innerHTML = ticket.priority;
  let keywords = ""
  ticket.keywords.map((keyword, index) =>{
    if(index !== 0){
      keywords += ', ' + keyword;
    }
    else{
      keywords += keyword;
    }
  });
  document.getElementById('categories').innerHTML = ticket.keywords[0];
  const keywordElem = document.getElementById('keywords');
  const descriptionElem = document.getElementById('description');
  const keywordList = document.createElement('p');
  keywordList.innerHTML = keywords;
  keywordElem.appendChild(keywordList);
  const description = document.createElement('p');
  description.innerHTML = ticket.description;
  descriptionElem.appendChild(description);
})
