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

def input_a_room_name?(rooms, input)
  rooms.keys.include?(input)
end

def input_is_rooms_you_can_connect_to?(room, input)
  room.connections.include?(input)
end

def input_does_room_have_treasure(room)
  room.treasure.empty?()
end

def is_door_locked(input, equipment)
  key = equipment.include?("key")
  if input == "4" && key == true
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
  puts "This room connects to:" + room.connections.join("-")
end

puts "Welcome to the game!"

room = rooms["START"]
describe_room(room)


#NEEDS REGEX TO TELL THE DIFFERENCE BETWEEN STRINGS AND INTEGERS - MOG
loop do
  decision = gets.strip
  input_a_room_name?(rooms, decision)
  puts equipment.empty?
  if
    if decision == "inventory"
      check_inventory(decision)
    end
    
    if input_does_room_have_treasure(room) == false
       open_treasure_chest(room,decision)
    else
      puts "There is nothing to open"
    end

    if input_is_rooms_you_can_connect_to?(room, decision)
      is_door_locked(decision, equipment)
      room = rooms[decision]
      describe_room(room)
    else
      puts "Connection to room does not exist"
    end
  end
end