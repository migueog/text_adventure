Room = Struct.new(:description, :connections, :treasure)

rooms = {
  "START" => Room.new("The room is illuminated by a single torch that hangs above a door ahead of you", 
                  ["1"], []),
  "1" => Room.new("This room is brightly illuminated. There are three doors",  ["2", "3", "4"], []),
  "2" => Room.new("There is a treasure chest in the middle of the room", ["1"], ["Gold!"]),
  "3" => Room.new("There is a treasure chest in the middle of the room", ["1"], ["Sword!"]),
  "4" => Room.new("You are now in the fourth room", ["1","5", "6"], []),
  "5" => Room.new("You are now in the fifth room", ["4", "7"], []),
  "6" => Room.new("You are now in the sixth room", ["4", "9"], []),
  "7" => Room.new("You are now in the seventh room", ["5", "8"], []),
  "8" => Room.new("You are now in the eigth room", ["7", "9"], []),
  "9" => Room.new("You are now in the ninth room", ["6", "8"], [])
}

equipment = Array.new

def input_is_a_room_you_can_connect_to?(room, input)
  room.connections.include?(input)
end

def does_room_have_treasure?(room)
  room.treasure.empty?()
end

def is_door_locked?(room_number, equipment)
  key = equipment.include?("key")
  if room_number == "4" && key == true
    room[4]
  else
    puts "The door is locked. Find the key"
  end
end

def check_inventory(input)
  if input == "inventory"
    puts equipment
  end
end

def open_treasure_chest(room, input)
  if input == "open"
    if room.treasure == "Empty"
      puts "There's nothing here :("
    else
      x = room.treasure
      puts "You have found" + x.to_s.strip
      equipment.push(room.treasure)
      room[:treasure] = "Empty"
      room[:description] = "There is a treasure chest in the middle of the room but you have already opened it"
      end
  end
end

def describe_room(room)
  puts room.description
  puts "This room connects to: " + room.connections.join("-")
end

def sanitize_input(input)
  input.strip.downcase
end

def input_looks_like_a_room_name?(input)
  input =~ /\d+/
end

def move_to_new_room(current_room, new_room)
  current_room = new_room
end

def parse_command(rooms, room, equipment, input)
  input = sanitize_input(input)

  if input == "inventory"
    check_inventory(input)
  elsif input == "open"
    if does_room_have_treasure?(room)
      open_treasure_chest(room, input)
    else
      puts "There is nothing to open"
    end
  elsif input_looks_like_a_room_name?(input)
    if input_is_a_room_you_can_connect_to?(room, input)
      is_door_locked?(input, equipment)
      move_to_new_room(room, rooms[input])
      describe_room(room)
    else
      puts "Connection to room does not exist"
    end
  elsif input == "quit"
    puts "Thanks for playing! Quitting."
    exit
  else
    puts "I did not understand."
  end
end

puts "Welcome to the game!"

room = rooms["START"]
describe_room(room)

loop do
  decision = gets

  parse_command(rooms, room, equipment, decision)
end