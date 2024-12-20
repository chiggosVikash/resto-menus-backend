import { prisma } from "../lib/prisma";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { generateToken, setTokensInCookies } from "../middlewares/authHandler";

export const createOwner = async (req:Request,res:Response,next:NextFunction):Promise<void>=>{

    try {
        /// hash the password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        req.body.password = hashedPassword;
        const owner = await prisma.owner.create({
            data: req.body
        });
        res.status(201).json(owner);
    } catch (error) {
        // console.log("Error in createOwner", error);
        next(error);
    }

}

export const ownerLogin = async (req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try{
        const owner = await prisma.owner.findUnique({
            where:{
                email:req.body.email
            }
        });
        if(!owner){
            res.status(404).json({message:"Owner not found"});
            return;
        }
        const isPasswordValid = await bcrypt.compare(req.body.password, owner.password);
        if(!isPasswordValid){
            res.status(401).json({message:"Invalid Userid or Password"});
            return;
        }
        /// generate token
        const token = generateToken({id:owner.id,email:owner.email,role:"owner"},"access");

        const refreshToken = generateToken({id:owner.id,email:owner.email,role:"owner"},"refresh");
        setTokensInCookies(res, token, refreshToken);
        res.status(200).json({
            success:true,
            message:"Owner logged in successfully",
            data:{
                access_token:token,
                email:owner.email,
                name:owner.name,
                role:"owner"
            }
           

        });
    }catch(error){
        next(error)
    }
}

export const createOutlet = async(req:Request, res:Response, next:NextFunction):Promise<void>=>{
    try{
        const outletData = req.body;

        const hashedPassword = await bcrypt.hash(outletData.password, 10);
        outletData.password = hashedPassword;
        console.log(outletData);
        const outlet = await prisma.outlet.create({
            data:{
                ...outletData,
                owner:{
                    connect:{
                        id:req.user?.id
                    }
                }
            }
        });
        // res.status(201).json(outlet);
        res.status(201).json({
            message:"Outlet created successfully",
            data:outlet
        })
    }catch(err){
        next(err);
    }
}

export const getOutlets = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try{
        const outlets = await prisma.outlet.findMany({
            where:{
            ownerId:req.user?.id
            },
            select: {
                id: true,
                outletName: true,
                outletType: true,
                email: true,
                city: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                password: false // explicitly exclude the password field
            }
        });
        res.status(200).json({
            success:true,
            data:outlets
        });
    }catch(err){
        next(err);
    }
}


