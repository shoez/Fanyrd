/* this is the code for the Arduino part of Fanyrd.com

Circuit consists of a servo plugged into the following connections:

Servo connectors:
power pin (red) = +5v
data pin (white) = pin 9 on Arduino (~ PWM output)
ground pin (black) = GND

*/




#include <Servo.h> 

int sensorPin = 0;    // select the input pin for the potentiometer
int sensorValue = 0;  // variable to store the value coming from the sensor

Servo myservo;  // create servo object to control a servo 
                // a maximum of eight servo objects can be created 
 
int pos = 0;    // variable to store the servo position 

void setup() 
{ 
  myservo.attach(9);  // attaches the servo on pin 9 to the servo object
  Serial.begin(9600); 
} 

void loop() {
  // read the value from the sensor:
  // sensorValue = analogRead(sensorPin); 
  if (Serial.available()) {
    char array[3];
    int i = 0;
    do {
      char value = Serial.read();
      Serial.println(value);
      if (value == '*') {
        char pos[4] = {array[0], array[1], array[2], '\0'};
        int sensorValue = atoi(pos);
        int angle = map(sensorValue, 0, 100, 1, 70);
        myservo.write(angle);              // tell servo to go to position in variable 'pos' 
        delay(15);                       // waits 15ms for the servo to reach the position 
        Serial.println("pos: " + angle);
      } else {
        array[i++] = value;      
      }
    } while(Serial.available());    
  }
                 
}
