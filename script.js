const cvs = document.querySelector('canvas');
const c = cvs.getContext('2d');

cvs.width = window.innerWidth / 1.7;
cvs.height = window.innerHeight / 1.25;

window.addEventListener('resize', function () {
  cvs.width = window.innerWidth / 1.7;
  cvs.height = window.innerHeight / 1.25;
  ring_x = cvs.width / 2.5;
  ring_y = cvs.height / 2;
  ring_rad = cvs.height / cvs.width * 300;
  arrange_nodes(ring_x, ring_y, ring_rad);
});

cvs.addEventListener('click', function(event) {
  // ensure simulation start flag is triggered
  if (!start_flag) {
    return;
  }
  
  /**
   * Firefox compatibility error
   * Fix from https://miloq.blogspot.com/2011/05/coordinates-mouse-click-canvas.html
   */
  if (event.pageX != undefined && event.pageY != undefined) {
    var x = event.pageX,
      y = event.pageY;
  } else {
    var x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }
  

      x = x - cvs.offsetLeft;
      y = y - cvs.offsetTop;

  for (let i = 0; i < node_array.length; i++) {
    if (mouse_collision(node_array[i], x, y, (1 / node_array.length) * 200)) {
      if (node_array[i].color != CALL_ELECTION) {
        node_array[i].initiate_election();
      }
      
    }
  }
});

cvs.addEventListener('contextmenu', function(event) {
  event.preventDefault();

  // ensure simulation start flag is triggered
  if (!start_flag) {
    return;
  }
  
  /**
   * Firefox compatibility error
   * Fix from https://miloq.blogspot.com/2011/05/coordinates-mouse-click-canvas.html
   */
  if (event.pageX != undefined && event.pageY != undefined) {
    var x = event.pageX,
      y = event.pageY;
  } else {
    var x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }
  

      x = x - cvs.offsetLeft;
      y = y - cvs.offsetTop;

  for (let i = 0; i < node_array.length; i++) {
    if (mouse_collision(node_array[i], x, y, (1 / node_array.length) * 200)) {
      toggle_crashed_node(node_array[i]);
    }
  }
});

function mouse_collision(node, mouse_x, mouse_y, offset) {
  if (mouse_x > node.x - offset
  &&  mouse_x < node.x + offset
  &&  mouse_y > node.y - offset
  &&  mouse_y < node.y + offset) {
    return true;
  } else {
    return false;
  }
}

function load_credits() {
  c.font = "40px Arial";
  c.fillText("Bully Leader Election Simulation", cvs.width / 5, window.innerHeight / 3);

  c.font = "30px Arial";
  c.fillText("Created by Alexander Richard", (cvs.width / 5) + 70, (window.innerHeight / 3) + 40);
}

function reset_button() {
  location.reload();
  return false;
}

function toggle_crashed_node(node) {
  if (node.color == CRASHED) {
    node.color = RUNNING_PROCESS;
    node.initiate_election();
    node.draw();

  } else {
    node.color = CRASHED;
    node.leader = -1;
    node.draw();
  }
}

function sleep(interval) {
  return new Promise(resolve => setTimeout(resolve, interval));
}

const BECOME_LEADER = 'red';
const CALL_ELECTION = 'blue';
const RUNNING_PROCESS = 'black';
const CRASHED = 'grey';

const MSG_ELECTION = 0;
const MSG_LEADER = 1;
const MSG_BULLY = 2;

const node_array = [];

const TIMEOUT_LEADER = 10;

var start_flag = false;
var pause_flag = false;

var ring_x = cvs.width / 2.5; // x value for the center of the ring
var ring_y = cvs.height / 2; // y value for the center of the ring
var ring_rad = cvs.height / cvs.width * 300; // radius of the ring

var simulation_speed = 1000;

function set_timing_interval(interval) {
  if (interval == -1) {
    document.getElementById("step_button").disabled = false;
    pause_flag = true;
  } 
  
  simulation_speed = interval;
}

function step() {
  pause_flag = false;
}

function check_negatives (input) {
  for (let i = 0; i < input.length; i++) {
    if (input[i] < 0) {
      return true;
    }
  }
  return false;
}

function check_repeat_ids (input) {
  let seen = [];
  for (let i = 0; i < input.length; i++) {
    if (seen.includes(input[i])) {
      return true;
    }
    seen.push(input[i]);
  }
  return false;
}

function parse_input() {
  let no_of_nodes = document.getElementById("structInput").value;

  // check the speed setting
  if (document.getElementById("fast").checked) {
    set_timing_interval(500);
  } else if (document.getElementById("slow").checked) {
    set_timing_interval(1000);
  } else if (document.getElementById("step").checked) {
    set_timing_interval(-1);
  } else {
    alert("Error - Please Select a Speed for the Simulation");
    return;
  }

  // lock in the speed settings
  document.getElementById("fast").disabled = true;
  document.getElementById("slow").disabled = true;
  document.getElementById("step").disabled = true;
  document.getElementById("start_button").disabled = true;
  
  start_flag = true;
  init_simulation(no_of_nodes);
}

/*
 * type: 0 - election; 1 - leader; 2 - bully
 */
class Message {
  constructor(type, payload, start_node, end_node) {
    this.type = type;
    this.payload = payload;
    this.startX = start_node.x;
    this.startY = start_node.y;
    this.endX = end_node.x;
    this.endY = end_node.y;
    this.start_node = start_node;
    this.end_node = end_node;
  }

  draw = () => {
    let label = null;
    if (this.type == 0) {
      label = "Election";
    } else if (this.type == 1) {
      label = "Leader";
    } else { // type == 2
      label = "Bully";
    }

    // draw the message lines
    c.strokeStyle = "black";
    c.beginPath();
    c.moveTo(this.startX, this.startY);
    c.lineTo(this.endX, this.endY);
    c.stroke();

    // draw the label
    c.font = "20px Arial";
    if (label == "Bully") {
        c.fillText(label, (this.startX + this.endX - 30) / 2, (this.startY + this.endY - 25) / 2);

    } else {
        c.fillText(label, (this.startX + this.endX + 15) / 2, (this.startY + this.endY + 15) / 2);
    }
  }
}

// enqeue with push and dequeue with shift (TODO: delete this comment)
function send_message_to_higher (type, payload, start_node) {
    let mssg = null;
    for (let i = 0; i < start_node.higher_ids.length; i++) {
        if (start_node.higher_ids[i].color == CRASHED) {
            continue;
        }

        mssg = new Message(type, payload, start_node, start_node.higher_ids[i]);
        mssg.draw();
        start_node.higher_ids[i].message_queue.push(mssg);
    }
}

function send_message_to_lower (type, payload, start_node) {
    let mssg = null;
    for (let i = 0; i < start_node.lower_ids.length; i++) {
        if (start_node.lower_ids[i].color == CRASHED) {
            continue;
        }

        mssg = new Message(type, payload, start_node, start_node.lower_ids[i]);
        mssg.draw();
        start_node.lower_ids[i].message_queue.push(mssg);
    }
}

function send_message (type, payload, start_node, end_node) {
    if (end_node.color == CRASHED) {
        return;
    }
    let mssg = null;
    mssg = new Message(type, payload, start_node, end_node);
    mssg.draw();
    end_node.message_queue.push(mssg);

}

class Node {
    constructor(id, index) {
      this.id = id;
      this.index = index;
      this.x = null;
      this.y = null;
      this.color = RUNNING_PROCESS;
      this.running = false;
      this.election = false;
      this.leader = -1;
      this.message_queue = [];
      this.leader_timer = 0;
      this.sent_election = false;
  
      this.lower_ids = [];
      this.higher_ids = [];
    }
  
    initiate_election = () => {
      if (this.leader == this.id || this.color == CRASHED) {
        return;
      }
  
      this.color = CALL_ELECTION;
      this.running = true;
      this.election = true;
      this.draw();
    }
  
    determine_msg_priority = () => {
      if (this.message_queue.length <= 1) {
        return;
      }
  
      let highest_pri = new Message(MSG_ELECTION, -1);
  
      for (let i=0; i < this.message_queue.length; i++) {
        if (this.message_queue[i].type == MSG_LEADER) {
          if (highest_pri.type == MSG_ELECTION) {
            highest_pri = this.message_queue[i];
          } else if (this.message_queue[i].payload >= highest_pri.payload) {
            highest_pri = this.message_queue[i];
          }
        } else {
          if (highest_pri.type == MSG_ELECTION && highest_pri.payload <= this.message_queue[i].payload) {
            highest_pri = this.message_queue[i];
          }
        }
      }
  
      this.message_queue = [highest_pri];
    }
  
    run = () => {

      if (this.leader_timer == TIMEOUT_LEADER) {
        this.color = BECOME_LEADER;
        send_message_to_higher(MSG_LEADER, this.id, node_array[this.index]);
        send_message_to_lower(MSG_LEADER, this.id, node_array[this.index]);
      }

      if (this.counting_to_leader == true) {
          this.leader_timer++;
      } else {
          this.leader_timer = 0;
      }

      if (this.election) {
        this.election = false;
        this.counting_to_leader = true;
        send_message_to_higher(MSG_ELECTION, this.id, node_array[this.index]);
        
      } else if (this.message_queue.length == 0) {
        return 1;
      }
      
  
      if (this.message_queue.length != 0) {
        let msg = this.message_queue.shift();

        if (msg.type == MSG_ELECTION) {
            if (msg.start_node.id < this.id) {
                send_message(MSG_BULLY, this.id, node_array[this.index], msg.start_node);
            }

            this.counting_to_leader = true;
            if (!this.sent_election) {
                send_message_to_higher(MSG_ELECTION, this.id, node_array[this.index]);
                this.sent_election = true;
            }

        } else if (msg.type == MSG_LEADER) {
            this.leader = msg.payload;
            this.color = RUNNING_PROCESS;
        } else { // MSG_BULLY
            this.counting_to_leader = false;
            this.sent_election = false;
        }
      }

      return 0;
    }
  
    draw = () => {
      c.strokeStyle = 'black';
      c.fillStyle = this.color;
      c.beginPath();
      c.arc(this.x, this.y, (1 / node_array.length) * 200, 0, 2 * Math.PI);
      c.fill(); // stroke() for lines
  
      // add the labels
      let font_size = 150 / node_array.length;
      c.font = font_size + "px Arial";
      c.strokeStyle = 'white';
      c.fillStyle = 'white';
      c.fillText(this.id, this.x - (c.measureText(this.id).width / 2), this.y+(font_size/3));
   
  
      //TODO: remove these comments
      // add the messages
      font_size = 150 / node_array.length;
      c.font = toString(font_size) + "px Arial";
  
      let msg_offset = -1;
  
      if (this.x < ring_x) {
        msg_offset = -150;
      } else {
        msg_offset = 70;
      }
  
      c.strokeStyle = 'black';
      c.fillStyle = 'black';
      c.beginPath();
      if (this.message_queue.length == 0) {
        c.rect(this.x + msg_offset, this.y + 2, 80, 0 - font_size);
        c.stroke();
      }
  
      
      if (this.message_queue.length != 0) {
        if (this.message_queue[0].type == 0) {
          c.rect(this.x + msg_offset, this.y + 3, c.measureText("E: " + this.payload).width / 2, 0 - font_size);
          c.stroke();
          c.fillText('E: ' + this.message_queue[0].payload, this.x + msg_offset, this.y);
        } else {
          c.rect(this.x + msg_offset, this.y + 3, c.measureText("L: " + this.payload).width / 2, 0 - (font_size));
          c.stroke();
          c.fillText('L: ' + this.message_queue[0].payload, this.x + msg_offset, this.y);
        }
      }
    }
  }

function init_simulation(no_of_nodes) {
    for (let i = 0; i < no_of_nodes; i++) {
        node_array.push(new Node(i + 1, i));
    }

    // sort the nodes into higher or lower categories
    for (let i = 0; i < no_of_nodes; i++) {
        for (let j = 0; j < no_of_nodes; j++) {
            if (j == i) {
                continue;
            } else if (node_array[j].id < node_array[i].id) {
                node_array[i].lower_ids.push(node_array[j]);
            } else {
                node_array[i].higher_ids.push(node_array[j]);
            }
        }
    }

    arrange_nodes(ring_x, ring_y, ring_rad);

    start_simulation();
}

function create_animation(k) {
    let font_size = 150 / node_array.length;
    c.font = toString(font_size) + "px Arial";
    //c.fillText("Iteration: " + k, 20, 30); // uncomment to debug

    // draw the legend
    let legend_offset_x = cvs.width - 250;
    let legend_offset_y = 30;
    c.font = "23px Arial";
    c.fillText("Elected Leader", legend_offset_x, legend_offset_y + 20);
    c.fillText("Requesting an Election", legend_offset_x, legend_offset_y + 50);
    c.fillText("Crashed", legend_offset_x, legend_offset_y + 80);

    c.fillStyle = BECOME_LEADER;
    c.fillRect(legend_offset_x - 50, legend_offset_y + 20, 40, -20);

    c.fillStyle = CALL_ELECTION;
    c.fillRect(legend_offset_x - 50, legend_offset_y + 50, 40, -20);

    c.fillStyle = CRASHED;
    c.fillRect(legend_offset_x - 50, legend_offset_y + 80, 40, -20);

    // draw the nodes
    for (var e = 0; e < node_array.length; e++) {
        node_array[e].draw();
    }
}

async function start_simulation() {
    c.clearRect(0, 0, cvs.width, cvs.height);
    create_animation(0);
    let election = null;
    let next = -1;
    let skip = -1;

  
    for(let k = 0;;k++) {      
      await sleep(10);
  
      // run through all processes
      for (let i = 0; i < node_array.length; i++) {
        skip = node_array[i].run();
  
        if (simulation_speed != -1 && skip == 0) {
          await sleep(simulation_speed);
        } else {
          while (pause_flag && skip == 0) {
            await sleep(5);
          }
          pause_flag = true;
        }
        
        c.clearRect(0, 0, cvs.width, cvs.height);
        create_animation(k);
        
      }
    }
  }
  
  function arrange_nodes(x, y, r) {
    for (let i = 0; i < node_array.length; i++) {
      node_array[i].x = (x + r * Math.cos((2 * Math.PI) * i/node_array.length))
      node_array[i].y = (y + r * Math.sin((2 * Math.PI) * i/node_array.length))
    }
  }