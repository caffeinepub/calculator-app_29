import Runtime "mo:core/Runtime";

actor {
  public shared ({ caller }) func add(x : Float, y : Float) : async Float {
    x + y;
  };

  public shared ({ caller }) func subtract(x : Float, y : Float) : async Float {
    x - y;
  };

  public shared ({ caller }) func multiply(x : Float, y : Float) : async Float {
    x * y;
  };

  public shared ({ caller }) func divide(x : Float, y : Float) : async Float {
    if (y == 0.0) {
      Runtime.trap("Cannot divide by zero");
    } else {
      x / y;
    };
  };
};
