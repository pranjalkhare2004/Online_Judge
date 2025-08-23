/**
 * Alternative C++ solutions for "Add Two Numbers" problem
 * Testing different coding styles and approaches
 */

// Solution 1: Basic approach
const solution1 = `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`;

// Solution 2: Using long long for larger numbers
const solution2 = `#include <iostream>
using namespace std;

int main() {
    long long a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`;

// Solution 3: With function approach
const solution3 = `#include <iostream>
using namespace std;

int addTwoNumbers(int a, int b) {
    return a + b;
}

int main() {
    int a, b;
    cin >> a >> b;
    cout << addTwoNumbers(a, b) << endl;
    return 0;
}`;

// Solution 4: With error handling
const solution4 = `#include <iostream>
#include <limits>
using namespace std;

int main() {
    long long a, b;
    cin >> a >> b;
    
    // Check for overflow
    if ((b > 0 && a > LLONG_MAX - b) || (b < 0 && a < LLONG_MIN - b)) {
        cout << "OVERFLOW" << endl;
    } else {
        cout << a + b << endl;
    }
    
    return 0;
}`;

// Solution 5: Template approach
const solution5 = `#include <iostream>
using namespace std;

template<typename T>
T add(T a, T b) {
    return a + b;
}

int main() {
    int a, b;
    cin >> a >> b;
    cout << add(a, b) << endl;
    return 0;
}`;

module.exports = {
    solution1,
    solution2, 
    solution3,
    solution4,
    solution5
};
