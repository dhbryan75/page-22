import React from "react";
import { delay, randomDouble } from "../../Assets/Functions";
import { System, Circle, FixedRectangle, TYPE } from "../../Assets/Physic2d";

const interval = 1;

const dt = 0.03;
const g = 10;
const k = 50000;


const width = 1000;
const height = 600;
const wallWidth = 500;


class HomePage extends React.Component {
    state = {
        system: new System(g),
    }

    init() {
        const { system } = this.state;
        system.addObject(new FixedRectangle(0, -wallWidth, width, wallWidth, 0));
        system.addObject(new FixedRectangle(width, 0, wallWidth, height, 0));
        system.addObject(new FixedRectangle(300, 300, 500, 100, 0.5));
        system.addObject(new FixedRectangle(-wallWidth, 0, wallWidth, height, 0));
        for(let i=0; i<30; i++) {
            let radius = randomDouble(20, 30);
            system.addObject(new Circle(
                randomDouble(radius, width - radius),
                randomDouble(radius, height - radius),
                0,0,
                radius * radius,
                radius,
                k
            ));
        }
    }

    update() {
        const { system } = this.state;
        system.gravityAll();
        system.collisionAll();
        system.moveAll(dt);
        this.setState({ ...this.state });
    }

    async animate() {
        while(true) {
            this.update();
            await delay(interval);
        }
    }

    componentDidMount() {
        this.init();
        this.animate();
    }

    render() {
        const { width, height } = this.props;
        const { system } = this.state;

        let objects = system.objects.map(obj => {
            if(obj.type === TYPE.CIRCLE) {
                let left = obj.p.components[0] - obj.radius;
                let bottom = obj.p.components[1] - obj.radius;
                return (
                    <div
                        className="circle"
                        key={`c${obj.id}`}
                        style={{
                            position: "absolute",
                            left: left,
                            bottom: bottom,
                            width: 2 * obj.radius,
                            height: 2 * obj.radius,
                            background: "#000",
                            borderRadius: "50%",
                        }}
                    >
                    </div>
                );
            }
            if(obj.type === TYPE.FIXEDRECT) {
                let left = (obj.vertices[0].components[0] + obj.vertices[2].components[0] - obj.w) / 2;
                let bottom = (obj.vertices[0].components[1] + obj.vertices[2].components[1] - obj.h) / 2;
                return (
                    <div
                        className="fixedrect"
                        key={`fr${obj.id}`}
                        style={{
                            position: "absolute",
                            left: left,
                            bottom: bottom,
                            transform: `rotate(${-obj.angle}rad)`,
                            width: obj.w,
                            height: obj.h,
                            background: "#000",
                        }}
                    >
                    </div>
                );
            }
            return null;
        });

        return (
            <div className="home">
                <div 
                    className="screen" 
                    style={{
                        position: "absolute",
                        left: 100,
                        bottom: 100,
                    }}
                >
                    {objects}
                </div>
            </div>
        );
    }
}

export default HomePage;