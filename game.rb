class Connection
  def initialize(room_number, locked_state = :unlocked)
    @room_number = room_number
    @locked_state = locked_state
  end

  def locked?
    locked_state == :locked
  end

  def unlocked?
    !locked?
  end

  def connects_to
    @room_number
  end
end

Room = Struct.new(:description, :connections, :treasure)

def connects_to(rooms)
  rooms.map do |room|
    room_number = room
    locked_state = :unlocked

    if room_number.respond_to?(:keys)
      room_number = room.keys.first
      locked_state = room.values.first
    end

    Connection.new(room_number, locked_state)
  end
end

rooms = {
  "START" => Room.new("The room is illuminated by a single torch that hangs above a door ahead of you", 
                  connects_to(["1"]), []),
  "1" => Room.new("This room is brightly illuminated. There are three doors", connects_to(["2", "3", {"4" => :locked}]), []),
  "2" => Room.new("There is a treasure chest in the middle of the room", connects_to(["1"]), ["Gold!"]),
  "3" => Room.new("There is a treasure chest in the middle of the room", connects_to(["1"]), ["Sword!"]),
  "4" => Room.new("You are now in the fourth room", connects_to(["1", "5", "6"]), []),
  "5" => Room.new("You are now in the fifth room", connects_to(["4", "7"]), []),
  "6" => Room.new("You are now in the sixth room", connects_to(["4", "9"]), []),
  "7" => Room.new("You are now in the seventh room", connects_to(["5", "8"]), []),
  "8" => Room.new("You are now in the eigth room", connects_to(["7", "9"]), []),
  "9" => Room.new("You are now in the ninth room", connects_to(["6", "8"]), [])
}

equipment = Array.new

def input_is_a_room_you_can_connect_to?(room, input)
  room.connections.find do |connection|
    connection.connects_to == input
  end
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
  connection_names = room.connections.map {|connection| connection.connects_to}
  puts "This room connects to: " + connection_names.join("-")
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