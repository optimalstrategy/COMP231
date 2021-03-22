const showTicket = event =>{
  const ticketNo = event.target.parentNode.firstElementChild.innerHTML.split('#')[1];
  window.open(`/show.html?id=${ticketNo}`);
}

window.addEventListener('DOMContentLoaded', () =>{
  const parent = document.getElementById('tickets');
  tickets.map((ticket) =>{
    const elem = document.createElement('div');
    const wrapper = document.createElement('div');
    wrapper.classList.add('ticket-wrapper');
    elem.classList.add('ticket');
    elem.innerHTML = `
      <h3>Ticket#${ticket.ticket_no}</h3>
      <h4>${ticket.title}</h4>
      <p>${ticket.description}</p>
      <button type="button" class="show-btn" onclick=showTicket(event)>Show Ticket</button>
    `;
    wrapper.appendChild(elem);
    const priority = document.createElement('h4');
    priority.classList.add('priority');
    priority.innerHTML = `Priority: ${ticket.priority}`;
    wrapper.appendChild(priority);
    parent.appendChild(wrapper);
  })
})
